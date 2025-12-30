create extension if not exists "pgcrypto";

create table if not exists public.booking_requests (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    pickup_location text not null,
    drop_location text not null,
    pickup_date date,
    pickup_time time,
    trip_type text,
    contact_phone text not null,
    contact_email text,
    source text,
    referrer text,
    user_agent text,
    status text not null default 'new',
    owner_name text,
    priority text not null default 'warm',
    follow_up_at timestamptz,
    reminder_at timestamptz,
    reminder_status text,
    reminder_sent_at timestamptz,
    reminder_error text,
    follow_up_notes text,
    last_contacted_at timestamptz
);

alter table public.booking_requests enable row level security;

create policy "Allow public insert on booking requests"
    on public.booking_requests
    for insert
    with check (true);

grant usage on schema public to anon, authenticated;
grant insert on table public.booking_requests to anon, authenticated;

alter table public.booking_requests
    add column if not exists follow_up_at timestamptz,
    add column if not exists reminder_at timestamptz,
    add column if not exists follow_up_notes text,
    add column if not exists owner_name text,
    add column if not exists priority text default 'warm',
    add column if not exists last_contacted_at timestamptz,
    add column if not exists contact_email text,
    add column if not exists reminder_status text,
    add column if not exists reminder_sent_at timestamptz,
    add column if not exists reminder_error text;

create table if not exists public.lead_events (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.booking_requests(id) on delete cascade,
    created_at timestamptz not null default now(),
    event_type text not null,
    message text,
    meta jsonb,
    created_by text
);

create index if not exists lead_events_lead_id_idx
    on public.lead_events (lead_id, created_at desc);
