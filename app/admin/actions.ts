"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { setAdminSession, clearAdminSession, requireAdminSession } from "@/lib/admin/session";

const VALID_STATUSES = new Set(["new", "followup", "confirmed", "cancelled"]);
const VALID_PRIORITIES = new Set(["hot", "warm", "cold"]);

function parseDateTimeInput(value: FormDataEntryValue | null) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

function parseDateInput(value: FormDataEntryValue | null) {
    if (!value) return null;
    const raw = String(value).trim();
    return raw ? raw : null;
}

function parseTimeInput(value: FormDataEntryValue | null) {
    if (!value) return null;
    const raw = String(value).trim();
    return raw ? raw : null;
}

async function logLeadEvents(
    supabase: ReturnType<typeof getSupabaseServerClient>,
    leadId: string,
    events: Array<{
        event_type: string;
        message?: string | null;
        meta?: Json | null;
        created_by?: string | null;
    }>
) {
    if (events.length === 0) return;

    const payload = events.map((event) => ({
        lead_id: leadId,
        event_type: event.event_type,
        message: event.message ?? null,
        meta: event.meta ?? null,
        created_by: event.created_by ?? null,
    }));

    await supabase.from("lead_events").insert(payload);
}

export async function loginAdmin(formData: FormData) {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const expectedUsername = process.env.ADMIN_USERNAME ?? "";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
    const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "";

    if (!expectedUsername || !expectedPassword || !sessionSecret) {
        redirect("/admin/login?error=missing-config");
    }

    if (username !== expectedUsername || password !== expectedPassword) {
        redirect("/admin/login?error=invalid");
    }

    await setAdminSession(username);
    redirect("/admin");
}

export async function logoutAdmin() {
    await clearAdminSession();
    redirect("/admin/login");
}

export async function updateLead(formData: FormData) {
    const session = await requireAdminSession();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
        redirect("/admin?error=missing-id");
    }

    const statusRaw = String(formData.get("status") ?? "new").trim().toLowerCase();
    let status = VALID_STATUSES.has(statusRaw) ? statusRaw : "new";
    let followUpAt = parseDateTimeInput(formData.get("follow_up_at"));
    let reminderAt = parseDateTimeInput(formData.get("reminder_at"));
    const ownerNameRaw = String(formData.get("owner_name") ?? "").trim();
    const ownerName = ownerNameRaw ? ownerNameRaw : null;
    const priorityRaw = String(formData.get("priority") ?? "").trim().toLowerCase();
    const priority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : "warm";
    const contactEmailRaw = String(formData.get("contact_email") ?? "").trim();
    const contactEmail = contactEmailRaw ? contactEmailRaw : null;
    const newNoteRaw = String(formData.get("new_note") ?? "").trim();
    const newNote = newNoteRaw ? newNoteRaw : null;
    const quickAction = String(formData.get("quick_action") ?? "").trim();
    const nowIso = new Date().toISOString();
    let lastContactedAt: string | null = null;

    if (quickAction === "confirm") {
        status = "confirmed";
        lastContactedAt = nowIso;
    }

    if (quickAction === "reschedule") {
        status = "followup";
        followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    if (quickAction === "contacted") {
        lastContactedAt = nowIso;
    }

    if (newNote) {
        lastContactedAt = nowIso;
    }

    let supabase;
    try {
        supabase = getSupabaseServerClient();
    } catch (error) {
        redirect("/admin?error=missing-config");
    }

    const { data: existingLead } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    const reminderChanged =
        String(existingLead?.reminder_at ?? "") !== String(reminderAt ?? "");

    const updates: Record<string, unknown> = {
        status,
        follow_up_at: followUpAt,
        reminder_at: reminderAt,
        owner_name: ownerName,
        priority,
        contact_email: contactEmail,
    };

    if (reminderChanged) {
        updates.reminder_status = reminderAt ? "pending" : null;
        updates.reminder_sent_at = null;
        updates.reminder_error = null;
    }

    if (newNote) {
        updates.follow_up_notes = newNote;
    }

    if (lastContactedAt) {
        updates.last_contacted_at = lastContactedAt;
    }

    const { error } = await supabase
        .from("booking_requests")
        .update(updates)
        .eq("id", id);

    if (error) {
        redirect(`/admin?error=update-failed`);
    }

    const events: Array<{
        event_type: string;
        message?: string | null;
        meta?: Json | null;
        created_by?: string | null;
    }> = [];

    if (existingLead?.status !== status) {
        events.push({
            event_type: "status_changed",
            message: `Status updated to ${status}`,
            meta: { from: existingLead?.status ?? null, to: status },
            created_by: session.username,
        });
    }

    if (String(existingLead?.follow_up_at ?? "") !== String(followUpAt ?? "")) {
        events.push({
            event_type: "follow_up_updated",
            message: followUpAt
                ? `Follow-up set for ${followUpAt}`
                : "Follow-up cleared",
            created_by: session.username,
        });
    }

    if (String(existingLead?.reminder_at ?? "") !== String(reminderAt ?? "")) {
        events.push({
            event_type: "reminder_updated",
            message: reminderAt
                ? `Reminder scheduled for ${reminderAt}`
                : "Reminder cleared",
            created_by: session.username,
        });
    }

    if (existingLead?.owner_name !== ownerName) {
        events.push({
            event_type: "owner_updated",
            message: ownerName ? `Owner set to ${ownerName}` : "Owner cleared",
            created_by: session.username,
        });
    }

    if (existingLead?.priority !== priority) {
        events.push({
            event_type: "priority_updated",
            message: `Priority set to ${priority}`,
            created_by: session.username,
        });
    }

    if (newNote) {
        events.push({
            event_type: "note",
            message: newNote,
            created_by: session.username,
        });
    }

    if (lastContactedAt) {
        events.push({
            event_type: "contacted",
            message: "Lead contacted",
            created_by: session.username,
        });
    }

    await logLeadEvents(supabase, id, events);

    revalidatePath("/admin");
    redirect("/admin");
}

export async function createLead(formData: FormData) {
    const session = await requireAdminSession();

    const pickupLocation = String(formData.get("pickup_location") ?? "").trim();
    const dropLocation = String(formData.get("drop_location") ?? "").trim();
    const contactPhone = String(formData.get("contact_phone") ?? "").trim();
    const contactEmailRaw = String(formData.get("contact_email") ?? "").trim();
    const contactEmail = contactEmailRaw ? contactEmailRaw : null;

    if (!pickupLocation || !dropLocation || !contactPhone) {
        redirect("/admin?error=missing-fields");
    }

    const tripTypeRaw = String(formData.get("trip_type") ?? "").trim();
    const tripType = tripTypeRaw ? tripTypeRaw : null;
    const pickupDate = parseDateInput(formData.get("pickup_date"));
    const pickupTime = parseTimeInput(formData.get("pickup_time"));
    const statusRaw = String(formData.get("status") ?? "new").trim().toLowerCase();
    const status = VALID_STATUSES.has(statusRaw) ? statusRaw : "new";
    const priorityRaw = String(formData.get("priority") ?? "").trim().toLowerCase();
    const priority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : "warm";
    const ownerNameRaw = String(formData.get("owner_name") ?? "").trim();
    const ownerName = ownerNameRaw ? ownerNameRaw : session.username;
    const followUpAt = parseDateTimeInput(formData.get("follow_up_at"));
    const reminderAt = parseDateTimeInput(formData.get("reminder_at"));
    const followUpNotesRaw = String(formData.get("follow_up_notes") ?? "").trim();
    const followUpNotes = followUpNotesRaw ? followUpNotesRaw : null;
    const sourceRaw = String(formData.get("source") ?? "admin").trim();
    const source = sourceRaw ? sourceRaw : "admin";

    let supabase;
    try {
        supabase = getSupabaseServerClient();
    } catch (error) {
        redirect("/admin?error=missing-config");
    }

    const { data, error } = await supabase
        .from("booking_requests")
        .insert({
            pickup_location: pickupLocation,
            drop_location: dropLocation,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            trip_type: tripType,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            source,
            status,
            priority,
            owner_name: ownerName,
            follow_up_at: followUpAt,
            reminder_at: reminderAt,
            follow_up_notes: followUpNotes,
        })
        .select("id")
        .single();

    if (error) {
        redirect("/admin?error=create-failed");
    }

    if (data?.id) {
        const events = [
            {
                event_type: "created",
                message: "Lead created manually",
                created_by: session.username,
            },
        ];

        if (followUpNotes) {
            events.push({
                event_type: "note",
                message: followUpNotes,
                created_by: session.username,
            });
        }

        await logLeadEvents(supabase, data.id, events);
    }

    revalidatePath("/admin");
    redirect("/admin");
}
