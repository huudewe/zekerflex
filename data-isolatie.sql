-- Voer dit uit in Supabase SQL Editor.
-- Dit voorkomt dat werkgevers elkaars shifts of kandidaten kunnen lezen/wijzigen.

create or replace function public.set_verified_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  new.raw_app_meta_data := jsonb_set(
    coalesce(new.raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(case when requested_role = 'opdrachtgever' then 'opdrachtgever' else 'werknemer' end),
    true
  );
  return new;
end;
$$;

drop trigger if exists set_verified_user_role on auth.users;
create trigger set_verified_user_role
  before insert on auth.users
  for each row execute function public.set_verified_user_role();

alter table public.shifts add column if not exists user_id uuid references auth.users(id);
alter table public.shifts add column if not exists status text not null default 'open';
alter table public.applications add column if not exists applicant_user_id uuid references auth.users(id);
alter table public.applications add column if not exists status text not null default 'In behandeling';

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  note text,
  status text not null default 'In afwachting' check (status in ('In afwachting', 'Goedgekeurd', 'Afgewezen')),
  created_at timestamptz not null default now()
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('bankgegevens', 'belastinggegevens', 'identiteit')),
  document_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.shifts enable row level security;
alter table public.applications enable row level security;
alter table public.verification_requests enable row level security;
alter table public.time_entries enable row level security;

drop policy if exists "Workers create own time entries" on public.time_entries;
drop policy if exists "Workers see own time entries" on public.time_entries;
drop policy if exists "Employers review time entries" on public.time_entries;

create policy "Workers create own time entries" on public.time_entries
  for insert with check (auth.uid() = worker_id);

create policy "Workers see own time entries" on public.time_entries
  for select using (auth.uid() = worker_id);

create policy "Employers review time entries" on public.time_entries
  for all using (exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id where a.id = application_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id where a.id = application_id and s.user_id = auth.uid()));

drop policy if exists "Users create own verification requests" on public.verification_requests;
drop policy if exists "Users view own verification requests" on public.verification_requests;

create policy "Users create own verification requests" on public.verification_requests
  for insert with check (auth.uid() = user_id);

create policy "Users view own verification requests" on public.verification_requests
  for select using (auth.uid() = user_id);

-- Oude policies verwijderen als ze al bestaan.
drop policy if exists "Anyone can view open shifts" on public.shifts;
drop policy if exists "Employers manage own shifts" on public.shifts;
drop policy if exists "Workers create own applications" on public.applications;
drop policy if exists "Workers view own applications" on public.applications;
drop policy if exists "Employers view applications for own shifts" on public.applications;
drop policy if exists "Employers update applications for own shifts" on public.applications;

create policy "Users see open shifts or own shifts" on public.shifts
  for select using (status = 'open' or auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Employers insert own shifts" on public.shifts
  for insert with check (auth.uid() = user_id and (auth.jwt() -> 'app_metadata' ->> 'role') in ('opdrachtgever', 'admin'));

create policy "Employers update own shifts" on public.shifts
  for update using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Employers delete own shifts" on public.shifts
  for delete using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Workers create own applications" on public.applications
  for insert with check (auth.uid() = applicant_user_id and (auth.jwt() -> 'app_metadata' ->> 'role') = 'werknemer');

create policy "Workers see own applications" on public.applications
  for select using (auth.uid() = applicant_user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Workers cancel own applications" on public.applications;
create policy "Workers cancel own applications" on public.applications
  for update using (auth.uid() = applicant_user_id)
  with check (auth.uid() = applicant_user_id and status = 'Geannuleerd');

create policy "Employers see applications on own shifts" on public.applications
  for select using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));

create policy "Employers update applications on own shifts" on public.applications
  for update using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()))
  with check (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));
