-- =============================================
-- DADDYPOWER v2 – Erweitertes Schema
-- Admin-Policies, Video-Tabelle, Storage
-- =============================================

-- Videos pro Ergebnistyp und Sprache
create table if not exists result_videos (
  id uuid default gen_random_uuid() primary key,
  result_type text not null,         -- 'erschoepft', 'funktionierer', 'kaempfer', 'performer'
  language text not null,            -- 'de', 'en'
  video_url text not null,           -- URL zum Video (Supabase Storage oder YouTube)
  video_type text default 'upload',  -- 'upload' oder 'youtube'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(result_type, language)      -- Ein Video pro Typ + Sprache
);

-- RLS für result_videos
alter table result_videos enable row level security;

-- Jeder darf Videos lesen (Frontend braucht das)
create policy "Allow public read on result_videos"
  on result_videos for select
  to anon, authenticated
  using (true);

-- Nur eingeloggte User (Admin) dürfen Videos verwalten
create policy "Allow authenticated insert on result_videos"
  on result_videos for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on result_videos"
  on result_videos for update
  to authenticated
  using (true);

create policy "Allow authenticated delete on result_videos"
  on result_videos for delete
  to authenticated
  using (true);

-- Admin darf Leads lesen
create policy "Allow authenticated select on leads"
  on leads for select
  to authenticated
  using (true);

-- Admin darf Events lesen
create policy "Allow authenticated select on events"
  on events for select
  to authenticated
  using (true);

-- updated_at Trigger für result_videos
create trigger result_videos_updated_at
  before update on result_videos
  for each row execute function update_updated_at();

-- =============================================
-- Supabase Storage Bucket für Videos
-- Manuell im Dashboard erstellen:
-- 1. Storage → New Bucket → Name: "videos" → Public: true
-- 2. Policy: Allow authenticated users to upload
-- =============================================
