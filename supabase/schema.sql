-- Run once in Supabase SQL Editor.
-- Roles are stored in auth user metadata during registration.

alter table public.shifts add column if not exists user_id uuid references auth.users(id);
alter table public.shifts add column if not exists status text not null default 'open';
alter table public.shifts add column if not exists starts_at timestamptz;
alter table public.shifts add column if not exists ends_at timestamptz;
alter table public.applications add column if not exists applicant_user_id uuid references auth.users(id);
alter table public.applications add column if not exists status text not null default 'In behandeling';

alter table public.shifts enable row level security;
alter table public.applications enable row level security;

create unique index if not exists applications_one_per_user_shift
on public.applications (shift_id, applicant_user_id)
where applicant_user_id is not null;

drop policy if exists "Anyone can view open shifts" on public.shifts;
drop policy if exists "Employers manage own shifts" on public.shifts;
drop policy if exists "Workers create own applications" on public.applications;
drop policy if exists "Workers view own applications" on public.applications;
drop policy if exists "Employers view applications for own shifts" on public.applications;
drop policy if exists "Employers update applications for own shifts" on public.applications;
drop policy if exists "Admins manage shifts" on public.shifts;
drop policy if exists "Admins manage applications" on public.applications;

create policy "Anyone can view open shifts" on public.shifts for select using (status = 'open' or auth.uid() = user_id);
create policy "Employers manage own shifts" on public.shifts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Workers create own applications" on public.applications for insert with check (auth.uid() = applicant_user_id);
create policy "Workers view own applications" on public.applications for select using (auth.uid() = applicant_user_id);
create policy "Employers view applications for own shifts" on public.applications for select using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));
create policy "Employers update applications for own shifts" on public.applications for update using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));

create policy "Admins manage shifts" on public.shifts for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admins manage applications" on public.applications for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

alter table public.shifts replica identity full;
alter table public.applications replica identity full;
do $$
begin
	if not exists (select 1 from pg_publication_rel where prpubid = (select oid from pg_publication where pubname = 'supabase_realtime') and prrelid = 'public.shifts'::regclass) then
		alter publication supabase_realtime add table public.shifts;
	end if;
	if not exists (select 1 from pg_publication_rel where prpubid = (select oid from pg_publication where pubname = 'supabase_realtime') and prrelid = 'public.applications'::regclass) then
		alter publication supabase_realtime add table public.applications;
	end if;
end $$;

-- This file is safe to run again: existing policies are replaced above.
