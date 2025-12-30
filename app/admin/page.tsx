import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createLead, updateLead } from "./actions";
import styles from "./page.module.css";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
    { value: "new", label: "New" },
    { value: "followup", label: "Follow Up" },
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
];

type Lead = Database["public"]["Tables"]["booking_requests"]["Row"];
type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];

const PRIORITY_OPTIONS = [
    { value: "hot", label: "Hot" },
    { value: "warm", label: "Warm" },
    { value: "cold", label: "Cold" },
];

function normalizePhoneForWhatsApp(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
}

function buildWhatsAppMessage(lead: Lead) {
    const tripDate = lead.pickup_date ?? "your travel date";
    const tripTime = lead.pickup_time ?? "your travel time";
    return (
        `Cabigo reminder: Your trip from ${lead.pickup_location} to ${lead.drop_location} ` +
        `on ${tripDate} ${tripTime}. Please reply to confirm.`
    );
}

function formatTimestamp(value: string | null | undefined) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toISOString().replace("T", " ").slice(0, 16);
}

function formatDateTimeInput(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
}

function formatDate(value: string | null | undefined) {
    if (!value) return "N/A";
    return value;
}

export default async function AdminPage({
    searchParams,
}: {
    searchParams?: {
        error?: string;
        q?: string;
        status?: string;
        priority?: string;
        owner?: string;
        date?: string;
        source?: string;
    };
}) {
    const session = await requireAdminSession();

    const searchQuery = (searchParams?.q ?? "").trim();
    const statusFilter = (searchParams?.status ?? "all").trim();
    const priorityFilter = (searchParams?.priority ?? "all").trim();
    const ownerFilter = (searchParams?.owner ?? "").trim();
    const dateFilter = (searchParams?.date ?? "").trim();
    const sourceFilter = (searchParams?.source ?? "").trim();

    let leads: Lead[] = [];
    let leadEvents: LeadEvent[] = [];
    let loadError = "";

    try {
        const supabase = getSupabaseServerClient();
        let query = supabase
            .from("booking_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(250);

        if (statusFilter && statusFilter !== "all") {
            query = query.eq("status", statusFilter);
        }

        if (priorityFilter && priorityFilter !== "all") {
            query = query.eq("priority", priorityFilter);
        }

        if (ownerFilter) {
            query = query.ilike("owner_name", `%${ownerFilter}%`);
        }

        if (dateFilter) {
            query = query.eq("pickup_date", dateFilter);
        }

        if (sourceFilter) {
            query = query.ilike("source", `%${sourceFilter}%`);
        }

        if (searchQuery) {
            const likeQuery = `%${searchQuery}%`;
            query = query.or(
                `pickup_location.ilike.${likeQuery},drop_location.ilike.${likeQuery},contact_phone.ilike.${likeQuery},contact_email.ilike.${likeQuery}`
            );
        }

        const { data, error } = await query;

        if (error) {
            loadError = error.message;
        } else {
            leads = data ?? [];
        }

        if (!error && leads.length > 0) {
            const leadIds = leads.map((lead) => lead.id);
            const { data: events, error: eventsError } = await supabase
                .from("lead_events")
                .select("*")
                .in("lead_id", leadIds)
                .order("created_at", { ascending: false });

            if (!eventsError) {
                leadEvents = events ?? [];
            }
        }
    } catch (error) {
        loadError = error instanceof Error ? error.message : "Failed to load leads.";
    }

    const counts = leads.reduce((acc: Record<string, number>, lead) => {
        const status = lead.status ?? "new";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
    }, {});

    const eventsByLead = leadEvents.reduce((acc: Record<string, LeadEvent[]>, event) => {
        const list = acc[event.lead_id] ?? [];
        list.push(event);
        acc[event.lead_id] = list;
        return acc;
    }, {});

    const lastNoteByLead: Record<string, LeadEvent | null> = {};
    Object.entries(eventsByLead).forEach(([leadId, events]) => {
        const noteEvent = events.find((event) => event.event_type === "note") ?? null;
        lastNoteByLead[leadId] = noteEvent;
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayByStatus = leads.reduce((acc: Record<string, number>, lead) => {
        if (!lead.created_at) return acc;
        if (new Date(lead.created_at) >= todayStart) {
            const status = lead.status ?? "new";
            acc[status] = (acc[status] ?? 0) + 1;
        }
        return acc;
    }, {});

    const weekByStatus = leads.reduce((acc: Record<string, number>, lead) => {
        if (!lead.created_at) return acc;
        if (new Date(lead.created_at) >= weekStart) {
            const status = lead.status ?? "new";
            acc[status] = (acc[status] ?? 0) + 1;
        }
        return acc;
    }, {});

    const totalLeads = leads.length;
    const confirmedLeads = counts.confirmed ?? 0;
    const conversionRate = totalLeads > 0 ? (confirmedLeads / totalLeads) * 100 : 0;

    const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
        const source = (lead.source ?? "unknown").toLowerCase();
        acc[source] = (acc[source] ?? 0) + 1;
        return acc;
    }, {});

    const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    let errorMessage = "";
    if (searchParams?.error === "update-failed") {
        errorMessage = "Update failed. Please retry.";
    } else if (searchParams?.error === "create-failed") {
        errorMessage = "Failed to add lead. Please retry.";
    } else if (searchParams?.error === "missing-fields") {
        errorMessage = "Pickup, drop, and phone are required to add a lead.";
    } else if (searchParams?.error === "missing-config") {
        errorMessage = "Missing server configuration for Supabase updates.";
    } else if (searchParams?.error) {
        errorMessage = "Something went wrong. Please retry.";
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.header}>
                    <div>
                        <p className={styles.kicker}>Cabigo Admin</p>
                        <h1 className={styles.title}>Lead Management</h1>
                        <p className={styles.subtitle}>
                            Logged in as {session.username}
                        </p>
                    </div>
                    <a href="/admin/logout" className={styles.logoutButton}>
                        Log out
                    </a>
                </div>

                {loadError ? (
                    <div className={styles.alert}>
                        <strong>Lead load failed.</strong> {loadError}
                        <div className={styles.alertNote}>
                            Check `SUPABASE_SERVICE_ROLE_KEY` and apply
                            `supabase/booking-requests.sql` updates.
                        </div>
                    </div>
                ) : null}

                {errorMessage ? (
                    <div className={styles.alert}>{errorMessage}</div>
                ) : null}

                <section className={styles.filtersCard}>
                    <form method="get" action="/admin" className={styles.filtersForm}>
                        <label className={styles.field}>
                            Search
                            <input
                                name="q"
                                type="text"
                                className={styles.input}
                                placeholder="Phone, pickup, drop"
                                defaultValue={searchQuery}
                            />
                        </label>
                        <label className={styles.field}>
                            Status
                            <select
                                name="status"
                                className={styles.select}
                                defaultValue={statusFilter || "all"}
                            >
                                <option value="all">All</option>
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className={styles.field}>
                            Priority
                            <select
                                name="priority"
                                className={styles.select}
                                defaultValue={priorityFilter || "all"}
                            >
                                <option value="all">All</option>
                                {PRIORITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className={styles.field}>
                            Owner
                            <input
                                name="owner"
                                type="text"
                                className={styles.input}
                                defaultValue={ownerFilter}
                            />
                        </label>
                        <label className={styles.field}>
                            Pickup Date
                            <input
                                name="date"
                                type="date"
                                className={styles.input}
                                defaultValue={dateFilter}
                            />
                        </label>
                        <label className={styles.field}>
                            Source
                            <input
                                name="source"
                                type="text"
                                className={styles.input}
                                defaultValue={sourceFilter}
                            />
                        </label>
                        <div className={styles.filterActions}>
                            <button type="submit" className={styles.saveButton}>
                                Apply
                            </button>
                            <a href="/admin" className={styles.clearButton}>
                                Clear
                            </a>
                        </div>
                    </form>
                </section>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span>Total Leads</span>
                        <strong>{leads.length}</strong>
                    </div>
                    <div className={styles.statCard}>
                        <span>New</span>
                        <strong>{counts.new ?? 0}</strong>
                    </div>
                    <div className={styles.statCard}>
                        <span>Follow Up</span>
                        <strong>{counts.followup ?? 0}</strong>
                    </div>
                    <div className={styles.statCard}>
                        <span>Confirmed</span>
                        <strong>{counts.confirmed ?? 0}</strong>
                    </div>
                    <div className={styles.statCard}>
                        <span>Cancelled</span>
                        <strong>{counts.cancelled ?? 0}</strong>
                    </div>
                </div>

                <section className={styles.reportingCard}>
                    <div className={styles.reportingHeader}>
                        <h2 className={styles.sectionTitle}>Reporting</h2>
                        <p className={styles.sectionHint}>
                            Based on current filters.
                        </p>
                    </div>
                    <div className={styles.reportingGrid}>
                        <div className={styles.reportingBlock}>
                            <h3>Today</h3>
                            <ul className={styles.reportingList}>
                                {STATUS_OPTIONS.map((status) => (
                                    <li key={status.value}>
                                        {status.label}: {todayByStatus[status.value] ?? 0}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.reportingBlock}>
                            <h3>Last 7 Days</h3>
                            <ul className={styles.reportingList}>
                                {STATUS_OPTIONS.map((status) => (
                                    <li key={status.value}>
                                        {status.label}: {weekByStatus[status.value] ?? 0}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.reportingBlock}>
                            <h3>Conversion</h3>
                            <p className={styles.reportingValue}>
                                {conversionRate.toFixed(1)}%
                            </p>
                            <p className={styles.reportingHint}>
                                {confirmedLeads} confirmed / {totalLeads} total
                            </p>
                        </div>
                        <div className={styles.reportingBlock}>
                            <h3>Top Sources</h3>
                            <ul className={styles.reportingList}>
                                {topSources.length === 0 ? (
                                    <li>No sources yet</li>
                                ) : (
                                    topSources.map(([source, count]) => (
                                        <li key={source}>
                                            {source}: {count}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className={styles.leadFormCard}>
                    <div className={styles.leadFormHeader}>
                        <h2 className={styles.sectionTitle}>Add Lead Manually</h2>
                        <p className={styles.sectionHint}>
                            Capture phone enquiries or offline requests.
                        </p>
                    </div>
                    <form className={styles.leadForm} action={createLead}>
                        <div className={styles.leadFormGrid}>
                            <label className={styles.field}>
                                Pickup Location *
                                <input
                                    name="pickup_location"
                                    type="text"
                                    className={styles.input}
                                    required
                                />
                            </label>
                            <label className={styles.field}>
                                Drop Location *
                                <input
                                    name="drop_location"
                                    type="text"
                                    className={styles.input}
                                    required
                                />
                            </label>
                            <label className={styles.field}>
                                Phone *
                                <input
                                    name="contact_phone"
                                    type="tel"
                                    className={styles.input}
                                    required
                                />
                            </label>
                            <label className={styles.field}>
                                Email
                                <input
                                    name="contact_email"
                                    type="email"
                                    className={styles.input}
                                />
                            </label>
                            <label className={styles.field}>
                                Trip Type
                                <input
                                    name="trip_type"
                                    type="text"
                                    list="trip-types"
                                    className={styles.input}
                                    placeholder="one-way"
                                />
                            </label>
                            <label className={styles.field}>
                                Pickup Date
                                <input
                                    name="pickup_date"
                                    type="date"
                                    className={styles.input}
                                />
                            </label>
                            <label className={styles.field}>
                                Pickup Time
                                <input
                                    name="pickup_time"
                                    type="time"
                                    className={styles.input}
                                />
                            </label>
                            <label className={styles.field}>
                                Status
                                <select name="status" className={styles.select} defaultValue="new">
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={styles.field}>
                                Priority
                                <select name="priority" className={styles.select} defaultValue="warm">
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={styles.field}>
                                Follow Up At
                                <input
                                    name="follow_up_at"
                                    type="datetime-local"
                                    className={styles.input}
                                />
                            </label>
                            <label className={styles.field}>
                                Reminder At
                                <input
                                    name="reminder_at"
                                    type="datetime-local"
                                    className={styles.input}
                                />
                            </label>
                            <label className={styles.field}>
                                Owner
                                <input
                                    name="owner_name"
                                    type="text"
                                    className={styles.input}
                                    defaultValue={session.username}
                                />
                            </label>
                            <label className={styles.field}>
                                Source
                                <input
                                    name="source"
                                    type="text"
                                    className={styles.input}
                                    defaultValue="admin"
                                />
                            </label>
                        </div>
                        <label className={styles.field}>
                            Notes
                            <textarea
                                name="follow_up_notes"
                                className={styles.textarea}
                                rows={3}
                            />
                        </label>
                        <div className={styles.leadFormActions}>
                            <button type="submit" className={styles.saveButton}>
                                Add Lead
                            </button>
                        </div>
                        <datalist id="trip-types">
                            <option value="one-way" />
                            <option value="round-trip" />
                            <option value="airport" />
                            <option value="outstation" />
                        </datalist>
                    </form>
                </section>

                <div className={styles.leadTable}>
                    <div className={styles.tableHeader}>
                        <span>Lead</span>
                        <span>Travel Date</span>
                        <span>Contact</span>
                        <span>Status</span>
                        <span>Follow Up</span>
                        <span>Reminder</span>
                        <span>Notes</span>
                        <span>Actions</span>
                    </div>

                    {leads.length === 0 ? (
                        <div className={styles.emptyState}>
                            No leads yet. New booking requests will appear here.
                        </div>
                    ) : null}

                    {leads.map((lead) => {
                        const phone = normalizePhoneForWhatsApp(lead.contact_phone);
                        const message = buildWhatsAppMessage(lead);
                        const whatsAppUrl = phone
                            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                            : "";
                        const priorityLabel =
                            PRIORITY_OPTIONS.find((option) => option.value === (lead.priority ?? "warm"))
                                ?.label ?? "Warm";
                        const timelineEvents = eventsByLead[lead.id] ?? [];
                        const lastNote = lastNoteByLead[lead.id];
                        const notePreview = lastNote?.message ?? lead.follow_up_notes ?? "";
                        const hasCreatedEvent = timelineEvents.some(
                            (event) => event.event_type === "created"
                        );
                        const createdEvent: LeadEvent = {
                            id: `${lead.id}-created`,
                            lead_id: lead.id,
                            created_at: lead.created_at,
                            event_type: "created",
                            message: "Lead created",
                            meta: null,
                            created_by: null,
                        };
                        const combinedTimeline = hasCreatedEvent
                            ? [...timelineEvents]
                            : [createdEvent, ...timelineEvents];
                        combinedTimeline.sort(
                            (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                        );

                        return (
                            <div key={lead.id} className={styles.leadRowGroup}>
                                <form
                                    className={styles.tableRow}
                                    action={updateLead}
                                >
                                    <input type="hidden" name="id" value={lead.id} />

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Lead</span>
                                        <div className={styles.leadTitleRow}>
                                            <div className={styles.leadTitle}>
                                                {lead.pickup_location}
                                                {" -> "}
                                                {lead.drop_location}
                                            </div>
                                            <span
                                                className={`${styles.priorityBadge} ${styles[`priority-${lead.priority ?? "warm"}`]}`}
                                            >
                                                {priorityLabel}
                                            </span>
                                        </div>
                                        <div className={styles.leadMeta}>
                                            Trip: {lead.trip_type ?? "N/A"}
                                        </div>
                                        <div className={styles.leadMeta}>
                                            Owner: {lead.owner_name ?? "Unassigned"}
                                        </div>
                                        <div className={styles.leadMeta}>
                                            Last contacted: {formatTimestamp(lead.last_contacted_at)}
                                        </div>
                                        <div className={styles.leadMeta}>
                                            Created: {formatTimestamp(lead.created_at)}
                                        </div>
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Travel Date</span>
                                        <div className={styles.leadMeta}>
                                            Date: {formatDate(lead.pickup_date)}
                                        </div>
                                        <div className={styles.leadMeta}>
                                            Time: {lead.pickup_time ?? "N/A"}
                                        </div>
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Contact</span>
                                        <div className={styles.leadTitle}>
                                            {lead.contact_phone}
                                        </div>
                                        {lead.contact_email ? (
                                            <div className={styles.leadMeta}>
                                                {lead.contact_email}
                                            </div>
                                        ) : null}
                                        <div className={styles.leadMeta}>
                                            Source: {lead.source ?? "web"}
                                        </div>
                                        <label className={styles.inlineField}>
                                            Owner
                                            <input
                                                name="owner_name"
                                                defaultValue={lead.owner_name ?? ""}
                                                className={styles.input}
                                            />
                                        </label>
                                        <label className={styles.inlineField}>
                                            Email
                                            <input
                                                name="contact_email"
                                                defaultValue={lead.contact_email ?? ""}
                                                className={styles.input}
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Status</span>
                                        <select
                                            name="status"
                                            defaultValue={lead.status ?? "new"}
                                            className={styles.select}
                                        >
                                            {STATUS_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            name="priority"
                                            defaultValue={lead.priority ?? "warm"}
                                            className={styles.select}
                                        >
                                            {PRIORITY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Follow Up</span>
                                        <input
                                            type="datetime-local"
                                            name="follow_up_at"
                                            defaultValue={formatDateTimeInput(lead.follow_up_at)}
                                            className={styles.input}
                                        />
                                        <button
                                            type="submit"
                                            name="quick_action"
                                            value="reschedule"
                                            className={styles.quickButton}
                                        >
                                            Reschedule +24h
                                        </button>
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Reminder</span>
                                        <input
                                            type="datetime-local"
                                            name="reminder_at"
                                            defaultValue={formatDateTimeInput(lead.reminder_at)}
                                            className={styles.input}
                                        />
                                        <div className={styles.leadMeta}>
                                            Status: {lead.reminder_status ?? "pending"}
                                        </div>
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Notes</span>
                                        {notePreview ? (
                                            <div className={styles.notePreview}>
                                                {notePreview}
                                            </div>
                                        ) : (
                                            <div className={styles.mutedText}>
                                                No notes yet
                                            </div>
                                        )}
                                        <textarea
                                            name="new_note"
                                            className={styles.textarea}
                                            rows={3}
                                            placeholder="Add a note..."
                                        />
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Actions</span>
                                        <div className={styles.actionButtons}>
                                            <button type="submit" className={styles.saveButton}>
                                                Update
                                            </button>
                                            <button
                                                type="submit"
                                                name="quick_action"
                                                value="confirm"
                                                className={styles.confirmButton}
                                            >
                                                Mark Confirmed
                                            </button>
                                            <button
                                                type="submit"
                                                name="quick_action"
                                                value="contacted"
                                                className={styles.quickButton}
                                            >
                                                Mark Contacted
                                            </button>
                                            <a
                                                href={`tel:${lead.contact_phone}`}
                                                className={styles.callButton}
                                            >
                                                Call Now
                                            </a>
                                            {whatsAppUrl ? (
                                                <a
                                                    href={whatsAppUrl}
                                                    className={styles.whatsappButton}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    WhatsApp
                                                </a>
                                            ) : (
                                                <span className={styles.mutedText}>
                                                    Phone missing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </form>
                                <div className={styles.timelineRow}>
                                    <div className={styles.timelineHeader}>
                                        Timeline
                                    </div>
                                    <ul className={styles.timelineList}>
                                        {combinedTimeline.length === 0 ? (
                                            <li className={styles.mutedText}>
                                                No activity yet.
                                            </li>
                                        ) : (
                                            combinedTimeline.map((event) => (
                                                <li key={event.id} className={styles.timelineItem}>
                                                    <span className={styles.timelineTime}>
                                                        {formatTimestamp(event.created_at)}
                                                    </span>
                                                    <span className={styles.timelineType}>
                                                        {event.event_type.replace("_", " ")}
                                                    </span>
                                                    {event.message ? (
                                                        <span className={styles.timelineMessage}>
                                                            {event.message}
                                                        </span>
                                                    ) : null}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
