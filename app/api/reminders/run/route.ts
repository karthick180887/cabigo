import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendWhatsAppReminder } from "@/lib/notifications/whatsapp";
import { sendSmsReminder } from "@/lib/notifications/sms";
import { sendEmailReminder } from "@/lib/notifications/email";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const MAX_BATCH = 50;

type LeadRow = Database["public"]["Tables"]["booking_requests"]["Row"];
type ReminderLead = Pick<
    LeadRow,
    | "id"
    | "pickup_location"
    | "drop_location"
    | "pickup_date"
    | "pickup_time"
    | "contact_phone"
    | "contact_email"
    | "reminder_at"
    | "reminder_status"
>;

function normalizePhone(phone: string | null) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
}

function buildReminderMessage(lead: ReminderLead) {
    const tripDate = lead.pickup_date ?? "your travel date";
    const tripTime = lead.pickup_time ?? "your travel time";
    return (
        `Cabigo reminder: Your trip from ${lead.pickup_location} to ${lead.drop_location} ` +
        `on ${tripDate} ${tripTime}. Please reply to confirm.`
    );
}

function buildWhatsAppVariables(lead: ReminderLead) {
    const tripDate = lead.pickup_date ?? "your travel date";
    const tripTime = lead.pickup_time ?? "your travel time";
    return [
        { type: "text" as const, text: lead.pickup_location },
        { type: "text" as const, text: lead.drop_location },
        { type: "text" as const, text: `${tripDate} ${tripTime}` },
    ];
}

async function logLeadEvent(
    supabase: ReturnType<typeof getSupabaseServerClient>,
    leadId: string,
    event: { event_type: string; message?: string | null }
) {
    await supabase.from("lead_events").insert({
        lead_id: leadId,
        event_type: event.event_type,
        message: event.message ?? null,
    });
}

async function runReminderDispatch(request: Request) {
    const secret = process.env.REMINDER_CRON_SECRET ?? "";
    if (secret) {
        const header =
            request.headers.get("x-reminder-secret") ??
            request.headers.get("authorization") ??
            "";
        const token = header.startsWith("Bearer ")
            ? header.slice(7).trim()
            : header.trim();

        if (!token || token !== secret) {
            return NextResponse.json(
                { ok: false, error: "unauthorized" },
                { status: 401 }
            );
        }
    }

    const supabase = getSupabaseServerClient();
    const nowIso = new Date().toISOString();

    const { data: leads, error } = await supabase
        .from("booking_requests")
        .select(
            "id,pickup_location,drop_location,pickup_date,pickup_time,contact_phone,contact_email,reminder_at,reminder_status"
        )
        .not("reminder_at", "is", null)
        .lte("reminder_at", nowIso)
        .or("reminder_status.is.null,reminder_status.eq.pending,reminder_status.eq.failed")
        .order("reminder_at", { ascending: true })
        .limit(MAX_BATCH);

    if (error) {
        return NextResponse.json(
            { ok: false, error: error.message },
            { status: 500 }
        );
    }

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let pending = 0;

    for (const lead of leads ?? []) {
        processed += 1;
        const phone = normalizePhone(lead.contact_phone);
        const email = (lead.contact_email ?? "").trim();
        const message = buildReminderMessage(lead);
        const variables = buildWhatsAppVariables(lead);

        let attempted = 0;
        let delivered = false;
        const errors: string[] = [];
        let sentVia = "";

        if (phone) {
            const whatsappResult = await sendWhatsAppReminder(phone, variables);
            if (whatsappResult.ok) {
                attempted += 1;
                delivered = true;
                sentVia = "whatsapp";
            } else if (whatsappResult.error !== "missing-config") {
                attempted += 1;
                errors.push(`whatsapp:${whatsappResult.error ?? "failed"}`);
            } else {
                errors.push("whatsapp:missing-config");
            }
        }

        if (!delivered && phone) {
            const smsResult = await sendSmsReminder(phone, message);
            if (smsResult.ok) {
                attempted += 1;
                delivered = true;
                sentVia = "sms";
            } else if (smsResult.error !== "missing-config") {
                attempted += 1;
                errors.push(`sms:${smsResult.error ?? "failed"}`);
            } else {
                errors.push("sms:missing-config");
            }
        }

        if (!delivered && email) {
            const emailResult = await sendEmailReminder(
                email,
                "Cabigo trip reminder",
                message
            );
            if (emailResult.ok) {
                attempted += 1;
                delivered = true;
                sentVia = "email";
            } else if (emailResult.error !== "missing-config") {
                attempted += 1;
                errors.push(`email:${emailResult.error ?? "failed"}`);
            } else {
                errors.push("email:missing-config");
            }
        }

        if (!phone && !email) {
            errors.push("missing-contact");
        }

        let reminderStatus = lead.reminder_status ?? "pending";
        let reminderSentAt: string | null = null;
        let reminderError: string | null = null;
        const now = new Date().toISOString();

        if (delivered) {
            reminderStatus = "sent";
            reminderSentAt = now;
            reminderError = null;
        } else if (attempted > 0) {
            reminderStatus = "failed";
            reminderError = errors.join(" | ").slice(0, 500);
        } else {
            reminderStatus = "pending";
            reminderError = errors.length ? errors.join(" | ").slice(0, 500) : null;
        }

        const updates: Record<string, unknown> = {
            reminder_status: reminderStatus,
            reminder_sent_at: reminderSentAt,
            reminder_error: reminderError,
        };

        if (delivered) {
            updates.last_contacted_at = now;
        }

        await supabase.from("booking_requests").update(updates).eq("id", lead.id);

        if (delivered) {
            sent += 1;
            await logLeadEvent(supabase, lead.id, {
                event_type: "reminder_sent",
                message: `Reminder sent via ${sentVia}`,
            });
        } else if (attempted > 0) {
            failed += 1;
            await logLeadEvent(supabase, lead.id, {
                event_type: "reminder_failed",
                message: errors.join(" | ").slice(0, 500),
            });
        } else {
            pending += 1;
        }
    }

    return NextResponse.json(
        { ok: true, processed, sent, failed, pending },
        { headers: { "Cache-Control": "no-store" } }
    );
}

export async function POST(request: Request) {
    return runReminderDispatch(request);
}

export async function GET(request: Request) {
    return runReminderDispatch(request);
}
