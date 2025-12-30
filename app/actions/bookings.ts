"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BOOKING_TABLE = "booking_requests";

const validTripTypes = new Set(["one-way", "round-trip", "airport"]);

function cleanValue(value: FormDataEntryValue | null, maxLength: number) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.slice(0, maxLength);
}

function toDate(value: string) {
    if (!value) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function toTime(value: string) {
    if (!value) return null;
    return /^\d{2}:\d{2}$/.test(value) ? value : null;
}

export async function createBooking(formData: FormData) {
    const pickup = cleanValue(formData.get("pickup"), 160);
    const drop = cleanValue(formData.get("drop"), 160);
    const phone = cleanValue(formData.get("phone"), 40);
    const tripTypeRaw = cleanValue(formData.get("tripType"), 40);
    const pickupDate = toDate(cleanValue(formData.get("date"), 20));
    const pickupTime = toTime(cleanValue(formData.get("time"), 20));
    const source = cleanValue(formData.get("source"), 40);

    if (!pickup || !drop || !phone) {
        redirect("/book?status=missing");
    }

    const tripType = validTripTypes.has(tripTypeRaw) ? tripTypeRaw : null;
    const requestHeaders = await headers();
    const referrer = requestHeaders.get("referer") ?? "";
    const userAgent = requestHeaders.get("user-agent") ?? "";

    try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from(BOOKING_TABLE)
            .insert({
                pickup_location: pickup,
                drop_location: drop,
                pickup_date: pickupDate,
                pickup_time: pickupTime,
                trip_type: tripType,
                contact_phone: phone,
                source: source || null,
                referrer: referrer || null,
                user_agent: userAgent || null,
            })
            .select("id")
            .single();

        if (error) throw error;

        if (data?.id) {
            const { error: eventError } = await supabase.from("lead_events").insert({
                lead_id: data.id,
                event_type: "created",
                message: "Lead created via website booking",
            });

            if (eventError) {
                console.warn("[createBooking] Lead event insert failed.", {
                    message: eventError.message,
                });
            }
        }
    } catch (error) {
        const fallback =
            error && typeof error === "object"
                ? (error as { message?: string }).message ?? ""
                : "";
        const message =
            error instanceof Error ? error.message : fallback;
        const info =
            error && typeof error === "object"
                ? (error as { code?: string; status?: number })
                : {};

        console.error("[createBooking] Supabase insert failed.", {
            message,
            code: info.code,
            status: info.status,
        });

        if (message.includes("Missing Supabase configuration")) {
            redirect("/book?status=missing-config");
        }
        if (message.toLowerCase().includes("invalid api key") || info.status === 401) {
            redirect("/book?status=unauthorized");
        }
        if (
            message.toLowerCase().includes("row-level security") ||
            message.toLowerCase().includes("permission denied") ||
            info.code === "42501"
        ) {
            redirect("/book?status=forbidden");
        }
        if (message.toLowerCase().includes("does not exist")) {
            redirect("/book?status=missing-table");
        }

        redirect("/book?status=error");
    }

    redirect("/book?submitted=1");
}
