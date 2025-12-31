import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createLead, updateLead, logCall, bulkUpdateLeads } from "./actions";
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

// Lead Age Helper Functions
function getLeadAgeDays(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function getLeadAgeClass(createdAt: string, lastContactedAt: string | null): string {
    const ageDays = getLeadAgeDays(createdAt);
    const daysSinceContact = lastContactedAt
        ? Math.floor((new Date().getTime() - new Date(lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
        : ageDays;

    if (daysSinceContact <= 1) return "age-fresh";
    if (daysSinceContact <= 3) return "age-warm";
    return "age-stale";
}

function getLeadAgeLabel(createdAt: string): string {
    const ageDays = getLeadAgeDays(createdAt);
    if (ageDays === 0) return "Today";
    if (ageDays === 1) return "1 day ago";
    return `${ageDays} days ago`;
}

function isFollowUpDueToday(followUpAt: string | null): boolean {
    if (!followUpAt) return false;
    const followUp = new Date(followUpAt);
    const now = new Date();
    return followUp.toDateString() === now.toDateString();
}

function isFollowUpOverdue(followUpAt: string | null): boolean {
    if (!followUpAt) return false;
    const followUp = new Date(followUpAt);
    const now = new Date();
    return followUp < now && followUp.toDateString() !== now.toDateString();
}

function isPickupToday(pickupDate: string | null): boolean {
    if (!pickupDate) return false;
    const pickup = new Date(pickupDate);
    const now = new Date();
    return pickup.toDateString() === now.toDateString();
}

function isStale(lead: Lead): boolean {
    const daysSinceContact = lead.last_contacted_at
        ? Math.floor((new Date().getTime() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
        : getLeadAgeDays(lead.created_at);
    return daysSinceContact > 7 && lead.status !== "confirmed" && lead.status !== "cancelled";
}

export default async function AdminPage({
    searchParams,
}: {
    searchParams?: Promise<{
        error?: string;
        q?: string;
        status?: string;
        priority?: string;
        owner?: string;
        date?: string;
        source?: string;
    }>;
}) {
    const session = await requireAdminSession();
    const params = await searchParams;

    const searchQuery = (params?.q ?? "").trim();
    const statusFilter = (params?.status ?? "all").trim();
    const priorityFilter = (params?.priority ?? "all").trim();
    const ownerFilter = (params?.owner ?? "").trim();
    const dateFilter = (params?.date ?? "").trim();
    const sourceFilter = (params?.source ?? "").trim();

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

    // Today's Follow-ups Panel Data
    const urgentPickups = leads.filter(lead =>
        isPickupToday(lead.pickup_date) && lead.status !== "confirmed" && lead.status !== "cancelled"
    );
    const dueToday = leads.filter(lead =>
        isFollowUpDueToday(lead.follow_up_at) && lead.status !== "confirmed" && lead.status !== "cancelled"
    );
    const overdueFollowups = leads.filter(lead =>
        isFollowUpOverdue(lead.follow_up_at) && lead.status !== "confirmed" && lead.status !== "cancelled"
    );
    const staleLeads = leads.filter(lead => isStale(lead));
    const hotLeads = leads.filter(lead => lead.priority === "hot" && lead.status !== "confirmed" && lead.status !== "cancelled");

    const needsAttentionCount = urgentPickups.length + dueToday.length + overdueFollowups.length;

    let errorMessage = "";
    let warningMessage = "";
    if (params?.error === "update-failed") {
        errorMessage = "Update failed. Please retry.";
    } else if (params?.error === "create-failed") {
        errorMessage = "Failed to add lead. Please retry.";
    } else if (params?.error === "missing-fields") {
        errorMessage = "From, To, and Mobile Number are required.";
    } else if (params?.error === "missing-config") {
        errorMessage = "Missing server configuration for Supabase updates.";
    } else if (params?.error === "duplicate") {
        warningMessage = "⚠️ A lead with this phone number already exists! Check the existing lead before adding a duplicate.";
    } else if (params?.error === "no-leads-selected") {
        errorMessage = "No leads selected for bulk action.";
    } else if (params?.error) {
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

                {warningMessage ? (
                    <div className={styles.alertWarning}>{warningMessage}</div>
                ) : null}

                {/* Today's Follow-ups Panel */}
                {needsAttentionCount > 0 && (
                    <section className={styles.urgentPanel}>
                        <div className={styles.urgentHeader}>
                            <h2 className={styles.sectionTitle}>⚡ Needs Attention ({needsAttentionCount})</h2>
                            <p className={styles.sectionHint}>Leads requiring immediate action today</p>
                        </div>
                        <div className={styles.urgentGrid}>
                            {urgentPickups.length > 0 && (
                                <div className={styles.urgentCard}>
                                    <span className={styles.urgentIcon}>🚗</span>
                                    <div>
                                        <strong>Pickup Today</strong>
                                        <p>{urgentPickups.length} lead{urgentPickups.length > 1 ? "s" : ""}</p>
                                        <ul className={styles.urgentList}>
                                            {urgentPickups.slice(0, 3).map(lead => (
                                                <li key={lead.id}>{lead.customer_name || lead.contact_phone}: {lead.pickup_location} → {lead.drop_location}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {overdueFollowups.length > 0 && (
                                <div className={`${styles.urgentCard} ${styles.urgentCardRed}`}>
                                    <span className={styles.urgentIcon}>⏰</span>
                                    <div>
                                        <strong>Overdue Follow-ups</strong>
                                        <p>{overdueFollowups.length} lead{overdueFollowups.length > 1 ? "s" : ""} past due</p>
                                        <ul className={styles.urgentList}>
                                            {overdueFollowups.slice(0, 3).map(lead => (
                                                <li key={lead.id}>{lead.customer_name || lead.contact_phone}: {lead.pickup_location}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {dueToday.length > 0 && (
                                <div className={styles.urgentCard}>
                                    <span className={styles.urgentIcon}>📞</span>
                                    <div>
                                        <strong>Follow-up Due Today</strong>
                                        <p>{dueToday.length} lead{dueToday.length > 1 ? "s" : ""}</p>
                                        <ul className={styles.urgentList}>
                                            {dueToday.slice(0, 3).map(lead => (
                                                <li key={lead.id}>{lead.customer_name || lead.contact_phone}: {lead.pickup_location}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Stale Leads Warning */}
                {staleLeads.length > 0 && (
                    <div className={styles.staleBanner}>
                        ⚠️ {staleLeads.length} stale lead{staleLeads.length > 1 ? "s" : ""} (no contact in 7+ days) -
                        <a href="/admin?priority=cold" className={styles.staleLink}> View cold leads</a>
                    </div>
                )}

                {/* Hot Leads Quick Access */}
                {hotLeads.length > 0 && (
                    <div className={styles.hotBanner}>
                        🔥 {hotLeads.length} hot lead{hotLeads.length > 1 ? "s" : ""} need priority attention -
                        <a href="/admin?priority=hot" className={styles.hotLink}> View hot leads</a>
                    </div>
                )}

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
                            Quick entry with essential fields.
                        </p>
                    </div>
                    <form className={styles.leadForm} action={createLead}>
                        <div className={styles.leadFormGrid}>
                            <label className={styles.field}>
                                Customer Name
                                <input
                                    name="customer_name"
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g. Ravi Kumar"
                                />
                            </label>
                            <label className={styles.field}>
                                From *
                                <input
                                    name="pickup_location"
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g. Chennai"
                                    required
                                />
                            </label>
                            <label className={styles.field}>
                                To *
                                <input
                                    name="drop_location"
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g. Bangalore"
                                    required
                                />
                            </label>
                            <label className={styles.field}>
                                Mobile Number *
                                <input
                                    name="contact_phone"
                                    type="tel"
                                    className={styles.input}
                                    placeholder="e.g. 9876543210"
                                    required
                                />
                            </label>
                        </div>
                        <input type="hidden" name="source" value="admin" />
                        <input type="hidden" name="status" value="new" />
                        <input type="hidden" name="priority" value="warm" />
                        <div className={styles.leadFormActions}>
                            <button type="submit" className={styles.saveButton}>
                                Add Lead
                            </button>
                        </div>
                    </form>
                </section>

                {/* Bulk Actions and Export Toolbar */}
                <section className={styles.toolbarCard}>
                    <div className={styles.toolbarLeft}>
                        <form action={bulkUpdateLeads} className={styles.bulkForm}>
                            <input type="hidden" name="lead_ids" id="bulk-lead-ids" value="" />
                            <select name="bulk_action" className={styles.select}>
                                <option value="">Bulk Action...</option>
                                <option value="status">Change Status</option>
                                <option value="priority">Change Priority</option>
                                <option value="owner">Assign Owner</option>
                            </select>
                            <select name="bulk_value" className={styles.select}>
                                <option value="">Select Value...</option>
                                <optgroup label="Status">
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Priority">
                                    {PRIORITY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <button type="submit" className={styles.quickButton}>
                                Apply to Selected
                            </button>
                        </form>
                    </div>
                    <div className={styles.toolbarRight}>
                        <a
                            href={`/admin/export?status=${statusFilter}&priority=${priorityFilter}`}
                            className={styles.exportButton}
                        >
                            📥 Export CSV
                        </a>
                    </div>
                </section>

                <div className={styles.leadTable}>
                    <div className={styles.tableHeader}>
                        <span>
                            <input
                                type="checkbox"
                                id="select-all-leads"
                                title="Select all leads"
                            />
                        </span>
                        <span>Lead</span>
                        <span>Travel Date</span>
                        <span>Contact</span>
                        <span>Status</span>
                        <span>Follow Up</span>
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

                        // Lead age and status indicators
                        const ageClass = getLeadAgeClass(lead.created_at, lead.last_contacted_at);
                        const ageLabel = getLeadAgeLabel(lead.created_at);
                        const isLeadStale = isStale(lead);
                        const isOverdue = isFollowUpOverdue(lead.follow_up_at);
                        const isUrgent = isPickupToday(lead.pickup_date);

                        return (
                            <div key={lead.id} className={`${styles.leadRowGroup} ${isOverdue ? styles.overdueRow : ""} ${isUrgent ? styles.urgentRow : ""}`}>
                                <form
                                    className={styles.tableRow}
                                    action={updateLead}
                                >
                                    <input type="hidden" name="id" value={lead.id} />

                                    {/* Checkbox Cell */}
                                    <div className={styles.checkboxCell}>
                                        <input
                                            type="checkbox"
                                            name="selected_lead"
                                            value={lead.id}
                                            className="lead-checkbox"
                                        />
                                    </div>

                                    <div className={styles.cell}>
                                        <span className={styles.cellLabel}>Lead</span>
                                        <div className={styles.leadTitleRow}>
                                            {/* Lead Age Badge */}
                                            <span className={`${styles.ageBadge} ${styles[ageClass]}`} title={`Created ${ageLabel}`}>
                                                {ageLabel}
                                            </span>
                                            {isLeadStale && <span className={styles.staleBadge} title="No contact in 7+ days">⚠️</span>}
                                        </div>
                                        {/* Customer Name */}
                                        {lead.customer_name && (
                                            <div className={styles.customerName}>
                                                👤 {lead.customer_name}
                                            </div>
                                        )}
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
                                            Trip: {lead.trip_type ?? "N/A"} | Owner: {lead.owner_name ?? "Unassigned"}
                                        </div>
                                        <div className={styles.leadMeta}>
                                            Calls: {lead.call_count ?? 0} | Last contact: {formatTimestamp(lead.last_contacted_at)}
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
                                                ✓ Confirm
                                            </button>
                                            <button
                                                type="submit"
                                                name="quick_action"
                                                value="contacted"
                                                className={styles.quickButton}
                                            >
                                                📞 Contacted
                                            </button>
                                            <a
                                                href={`tel:${lead.contact_phone}`}
                                                className={styles.callButton}
                                            >
                                                📱 Call
                                            </a>
                                            {whatsAppUrl ? (
                                                <a
                                                    href={whatsAppUrl}
                                                    className={styles.whatsappButton}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    💬 WhatsApp
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </form>
                                {/* Log Call Form - separate form for quick call logging */}
                                <form action={logCall} className={styles.logCallForm}>
                                    <input type="hidden" name="id" value={lead.id} />
                                    <input
                                        type="text"
                                        name="call_note"
                                        placeholder="Quick call note (optional)"
                                        className={styles.callNoteInput}
                                    />
                                    <button type="submit" className={styles.logCallButton}>
                                        📝 Log Call #{(lead.call_count ?? 0) + 1}
                                    </button>
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
