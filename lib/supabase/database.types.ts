export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json }
    | Json[];

export type Database = {
    public: {
        Tables: {
            booking_requests: {
                Row: {
                    id: string;
                    created_at: string;
                    pickup_location: string;
                    drop_location: string;
                    pickup_date: string | null;
                    pickup_time: string | null;
                    trip_type: string | null;
                    contact_phone: string;
                    contact_email: string | null;
                    customer_name: string | null;
                    source: string | null;
                    referrer: string | null;
                    user_agent: string | null;
                    status: string;
                    owner_name: string | null;
                    priority: string;
                    follow_up_at: string | null;
                    reminder_at: string | null;
                    reminder_status: string | null;
                    reminder_sent_at: string | null;
                    reminder_error: string | null;
                    follow_up_notes: string | null;
                    last_contacted_at: string | null;
                    call_count: number;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    pickup_location: string;
                    drop_location: string;
                    pickup_date?: string | null;
                    pickup_time?: string | null;
                    trip_type?: string | null;
                    contact_phone: string;
                    contact_email?: string | null;
                    customer_name?: string | null;
                    source?: string | null;
                    referrer?: string | null;
                    user_agent?: string | null;
                    status?: string;
                    owner_name?: string | null;
                    priority?: string;
                    follow_up_at?: string | null;
                    reminder_at?: string | null;
                    reminder_status?: string | null;
                    reminder_sent_at?: string | null;
                    reminder_error?: string | null;
                    follow_up_notes?: string | null;
                    last_contacted_at?: string | null;
                    call_count?: number;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    pickup_location?: string;
                    drop_location?: string;
                    pickup_date?: string | null;
                    pickup_time?: string | null;
                    trip_type?: string | null;
                    contact_phone?: string;
                    contact_email?: string | null;
                    customer_name?: string | null;
                    source?: string | null;
                    referrer?: string | null;
                    user_agent?: string | null;
                    status?: string;
                    owner_name?: string | null;
                    priority?: string;
                    follow_up_at?: string | null;
                    reminder_at?: string | null;
                    reminder_status?: string | null;
                    reminder_sent_at?: string | null;
                    reminder_error?: string | null;
                    follow_up_notes?: string | null;
                    last_contacted_at?: string | null;
                    call_count?: number;
                };
                Relationships: [];
            };
            lead_events: {
                Row: {
                    id: string;
                    lead_id: string;
                    created_at: string;
                    event_type: string;
                    message: string | null;
                    meta: Json | null;
                    created_by: string | null;
                };
                Insert: {
                    id?: string;
                    lead_id: string;
                    created_at?: string;
                    event_type: string;
                    message?: string | null;
                    meta?: Json | null;
                    created_by?: string | null;
                };
                Update: {
                    id?: string;
                    lead_id?: string;
                    created_at?: string;
                    event_type?: string;
                    message?: string | null;
                    meta?: Json | null;
                    created_by?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {};
        Functions: {};
        Enums: {};
        CompositeTypes: {};
    };
};
