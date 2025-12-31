"use server";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const priorityFilter = searchParams.get("priority") || "all";

    try {
        const supabase = getSupabaseServerClient();
        let query = supabase
            .from("booking_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (statusFilter && statusFilter !== "all") {
            query = query.eq("status", statusFilter);
        }

        if (priorityFilter && priorityFilter !== "all") {
            query = query.eq("priority", priorityFilter);
        }

        const { data: leads, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!leads || leads.length === 0) {
            return new NextResponse("No leads to export", { status: 404 });
        }

        // Build CSV content
        const headers = [
            "ID",
            "Customer Name",
            "Phone",
            "Email",
            "From",
            "To",
            "Trip Type",
            "Pickup Date",
            "Pickup Time",
            "Status",
            "Priority",
            "Owner",
            "Source",
            "Call Count",
            "Last Contacted",
            "Follow Up At",
            "Created At",
            "Notes",
        ];

        const rows = leads.map((lead) => [
            lead.id,
            lead.customer_name ?? "",
            lead.contact_phone,
            lead.contact_email ?? "",
            lead.pickup_location,
            lead.drop_location,
            lead.trip_type ?? "",
            lead.pickup_date ?? "",
            lead.pickup_time ?? "",
            lead.status,
            lead.priority,
            lead.owner_name ?? "",
            lead.source ?? "",
            lead.call_count ?? 0,
            lead.last_contacted_at ?? "",
            lead.follow_up_at ?? "",
            lead.created_at,
            (lead.follow_up_notes ?? "").replace(/[\n\r,]/g, " "),
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n");

        const now = new Date().toISOString().slice(0, 10);
        const filename = `leads-export-${now}.csv`;

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Export failed" },
            { status: 500 }
        );
    }
}
