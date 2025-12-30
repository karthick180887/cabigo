import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient() {
    if (cachedClient) return cachedClient;

    const url =
        process.env.SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        process.env.SUPABASE_PROJECT_URL;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SECRET_KEY ??
        process.env.SUPABASE_ANON_KEY ??
        process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_KEY;

    if (!url || !key) {
        throw new Error(
            "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY."
        );
    }

    cachedClient = createClient<Database>(url, key, {
        auth: { persistSession: false },
    });

    return cachedClient;
}
