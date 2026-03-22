-- =============================================
-- KRAFTRESERVE MVP – Supabase Schema
-- =============================================

-- Leads / Warteliste
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  first_name text,
  quiz_result_type text,           -- z.B. 'erschoepft', 'funktionierer', 'performer', 'kaempfer'
  quiz_answers jsonb,              -- kompaktes JSON der Antworten
  biggest_challenge text,          -- optionale Freitext-Angabe
  interest text[],                 -- z.B. ['challenge', 'community', 'energy']
  consent boolean default false,   -- Datenschutz-Einwilligung
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index auf E-Mail für Duplikat-Prüfung
create unique index if not exists leads_email_idx on leads (email);

-- Tracking Events
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,        -- z.B. 'page_view', 'quiz_started', 'quiz_completed', 'waitlist_submitted'
  event_data jsonb,                -- flexible Zusatzdaten
  lead_id uuid references leads(id),
  session_id text,                 -- anonyme Session-ID
  page_path text,
  created_at timestamptz default now()
);

create index if not exists events_name_idx on events (event_name);
create index if not exists events_session_idx on events (session_id);

-- Row Level Security aktivieren
alter table leads enable row level security;
alter table events enable row level security;

-- Policies: Anon-User dürfen inserieren (Frontend), aber nicht lesen
create policy "Allow anonymous insert on leads"
  on leads for insert
  to anon
  with check (true);

create policy "Allow anonymous insert on events"
  on events for insert
  to anon
  with check (true);

-- updated_at Trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();
