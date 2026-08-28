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
    to_jsonb(case when requested_role in ('opdrachtgever', 'bureau_partner') then requested_role else 'werknemer' end),
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

create table if not exists public.model_agreements (
  id uuid primary key default gen_random_uuid(),
  application_id bigint not null unique references public.applications(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'pending', 'signed', 'cancelled')),
  agreement_type text not null default 'Freelance',
  created_at timestamptz not null default now()
);

alter table public.model_agreements enable row level security;
drop policy if exists "Workers create own model agreements" on public.model_agreements;
create policy "Workers create own model agreements" on public.model_agreements
  for insert with check (auth.uid() = worker_id and exists (select 1 from public.applications where id = application_id and applicant_user_id = auth.uid()));
drop policy if exists "Participants view model agreements" on public.model_agreements;
create policy "Participants view model agreements" on public.model_agreements
  for select using (auth.uid() = worker_id or exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id where a.id = application_id and s.user_id = auth.uid()));

create or replace function public.create_model_agreement_for_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.model_agreements (application_id, worker_id)
  values (new.id, new.applicant_user_id)
  on conflict (application_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_model_agreement_after_application on public.applications;
create trigger create_model_agreement_after_application
  after insert on public.applications
  for each row execute function public.create_model_agreement_for_application();

create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  application_id bigint not null unique references public.applications(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.shift_groups (id uuid primary key default gen_random_uuid(), shift_id bigint not null references public.shifts(id) on delete cascade, name text not null, created_by uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.shift_group_members (group_id uuid not null references public.shift_groups(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, is_manager boolean not null default false, created_at timestamptz not null default now(), primary key (group_id, user_id));
create table if not exists public.chat_polls (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.direct_conversations(id) on delete cascade, question text not null, options jsonb not null, created_by uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.chat_poll_votes (poll_id uuid not null references public.chat_polls(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, option_index integer not null, created_at timestamptz not null default now(), primary key (poll_id, user_id));
alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.shift_groups enable row level security;
alter table public.shift_group_members enable row level security;
alter table public.chat_polls enable row level security;
alter table public.chat_poll_votes enable row level security;
drop policy if exists "Participants view direct conversations" on public.direct_conversations;
drop policy if exists "Participants view direct messages" on public.direct_messages;
drop policy if exists "Participants send direct messages" on public.direct_messages;
drop policy if exists "Participants manage shift groups" on public.shift_groups;
drop policy if exists "Participants view group members" on public.shift_group_members;
drop policy if exists "Participants manage chat polls" on public.chat_polls;
drop policy if exists "Participants vote chat polls" on public.chat_poll_votes;
create policy "Participants view direct conversations" on public.direct_conversations for select using (auth.uid() = worker_id or auth.uid() = employer_id);
create policy "Participants view direct messages" on public.direct_messages for select using (exists (select 1 from public.direct_conversations c where c.id = public.direct_messages.conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id)));
create policy "Participants send direct messages" on public.direct_messages for insert with check (auth.uid() = sender_id and exists (select 1 from public.direct_conversations c where c.id = public.direct_messages.conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id)));
create policy "Participants manage shift groups" on public.shift_groups for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "Participants view group members" on public.shift_group_members for select using (auth.uid() = user_id);
create policy "Participants manage chat polls" on public.chat_polls for all using (exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id))) with check (auth.uid() = created_by);
create policy "Participants vote chat polls" on public.chat_poll_votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.accept_application(application_id_input bigint, shift_id_input bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  update public.shifts set status = 'vervuld' where id = shift_id_input and status = 'open' and user_id = auth.uid();
  claimed := found;
  if not claimed then return false; end if;
  update public.applications set status = 'Aangenomen' where id = application_id_input and shift_id = shift_id_input;
  if not found then
    update public.shifts set status = 'open' where id = shift_id_input and user_id = auth.uid();
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.accept_application(bigint, bigint) from public;
grant execute on function public.accept_application(bigint, bigint) to authenticated;

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  application_id bigint not null references public.applications(id) on delete cascade,
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
drop policy if exists "Users see open shifts or own shifts" on public.shifts;
drop policy if exists "Employers insert own shifts" on public.shifts;
drop policy if exists "Employers update own shifts" on public.shifts;
drop policy if exists "Employers delete own shifts" on public.shifts;
drop policy if exists "Workers create own applications" on public.applications;
drop policy if exists "Workers view own applications" on public.applications;
drop policy if exists "Workers see own applications" on public.applications;
drop policy if exists "Workers cancel own applications" on public.applications;
drop policy if exists "Employers view applications for own shifts" on public.applications;
drop policy if exists "Employers see applications on own shifts" on public.applications;
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

drop policy if exists "Employers update applications on own shifts" on public.applications;
create policy "Employers update applications on own shifts" on public.applications
  for update using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()))
  with check (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));

-- Bureau Partners: isolated agency account, compliance gate and subscription state.
create table if not exists public.bureau_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  kvk_number text not null,
  sna_status text not null default 'pending' check (sna_status in ('pending', 'verified', 'rejected')),
  wtta_status text not null default 'pending' check (wtta_status in ('pending', 'verified', 'rejected')),
  compliance_accepted_at timestamptz,
  compliance_version text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bureau_profiles enable row level security;
drop policy if exists "Bureau partners view own profile" on public.bureau_profiles;
create policy "Bureau partners view own profile" on public.bureau_profiles for select using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Bureau partners update own profile" on public.bureau_profiles;
create policy "Bureau partners update own profile" on public.bureau_profiles for update using (auth.uid() = user_id and (auth.jwt() -> 'app_metadata' ->> 'role') = 'bureau_partner') with check (auth.uid() = user_id);
drop policy if exists "Bureau partners create own profile" on public.bureau_profiles;
create policy "Bureau partners create own profile" on public.bureau_profiles for insert with check (auth.uid() = user_id and (auth.jwt() -> 'app_metadata' ->> 'role') = 'bureau_partner');

create table if not exists public.account_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'basic' check (tier in ('basic', 'pro', 'enterprise')),
  direct_priority boolean not null default false,
  suggested_priority boolean not null default false,
  chat_priority boolean not null default false,
  collection_method text not null default 'none' check (collection_method in ('none', 'direct_debit', 'invoice')),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.account_subscriptions enable row level security;
drop policy if exists "Users view own subscription" on public.account_subscriptions;
create policy "Users view own subscription" on public.account_subscriptions for select using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins manage subscriptions" on public.account_subscriptions;
create policy "Admins manage subscriptions" on public.account_subscriptions for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.bureau_audit_logs (
  id uuid primary key default gen_random_uuid(),
  bureau_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.bureau_audit_logs enable row level security;
drop policy if exists "Bureau partners view own audit logs" on public.bureau_audit_logs;
create policy "Bureau partners view own audit logs" on public.bureau_audit_logs for select using (auth.uid() = bureau_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.bureau_has_access(bureau_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bureau_profiles p where p.user_id = bureau_user_id and p.active = true and p.compliance_accepted_at is not null and p.sna_status = 'verified' and p.wtta_status = 'verified')
    and exists (select 1 from public.account_subscriptions s where s.user_id = bureau_user_id and s.status = 'active' and (s.current_period_end is null or s.current_period_end > now()));
$$;
revoke all on function public.bureau_has_access(uuid) from public;
grant execute on function public.bureau_has_access(uuid) to authenticated;

create or replace function public.create_bureau_profile_from_auth()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ->> 'role' = 'bureau_partner' then
    insert into public.bureau_profiles (user_id, company_name, kvk_number, sna_status, wtta_status, compliance_accepted_at, compliance_version)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'company_name', 'Onbekend bureau'), coalesce(new.raw_user_meta_data ->> 'kvk_number', ''), coalesce(new.raw_user_meta_data ->> 'sna_status', 'pending'), coalesce(new.raw_user_meta_data ->> 'wtta_status', 'pending'), nullif(new.raw_user_meta_data ->> 'compliance_accepted_at', '')::timestamptz, new.raw_user_meta_data ->> 'compliance_version')
    on conflict (user_id) do update set company_name = excluded.company_name, kvk_number = excluded.kvk_number, sna_status = excluded.sna_status, wtta_status = excluded.wtta_status, compliance_accepted_at = excluded.compliance_accepted_at, compliance_version = excluded.compliance_version, updated_at = now();
    insert into public.account_subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists create_bureau_profile_after_auth on auth.users;
create trigger create_bureau_profile_after_auth after insert on auth.users for each row execute function public.create_bureau_profile_from_auth();

create or replace function public.expire_account_subscriptions()
returns integer language plpgsql security definer set search_path = public as $$
declare expired_count integer;
begin
  update public.account_subscriptions set status = 'past_due', direct_priority = false, suggested_priority = false, chat_priority = false, updated_at = now() where status = 'active' and current_period_end is not null and current_period_end <= now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;
revoke all on function public.expire_account_subscriptions() from public;
grant execute on function public.expire_account_subscriptions() to service_role;

create table if not exists public.bureau_workers (
  id uuid primary key default gen_random_uuid(),
  bureau_id uuid not null references auth.users(id) on delete cascade,
  worker_user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  email text,
  status text not null default 'active' check (status in ('active', 'invited', 'archived')),
  created_at timestamptz not null default now()
);
alter table public.bureau_workers enable row level security;
drop policy if exists "Bureaus manage own workers" on public.bureau_workers;
create policy "Bureaus manage own workers" on public.bureau_workers for all using (auth.uid() = bureau_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check (auth.uid() = bureau_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Users see open shifts or own shifts" on public.shifts;
create policy "Users see open shifts or own shifts" on public.shifts for select using (((auth.jwt() -> 'app_metadata' ->> 'role') <> 'bureau_partner' and status = 'open') or auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Employers insert own shifts" on public.shifts;
create policy "Employers insert own shifts" on public.shifts for insert with check (auth.uid() = user_id and (auth.jwt() -> 'app_metadata' ->> 'role') in ('opdrachtgever', 'bureau_partner', 'admin'));
drop policy if exists "Employers update own shifts" on public.shifts;
create policy "Employers update own shifts" on public.shifts for update using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Employers delete own shifts" on public.shifts;
create policy "Employers delete own shifts" on public.shifts for delete using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Workers create own applications" on public.applications;
create policy "Workers create own applications" on public.applications for insert with check (auth.uid() = applicant_user_id and (auth.jwt() -> 'app_metadata' ->> 'role') in ('werknemer', 'bureau_partner'));
drop policy if exists "Employers see applications on own shifts" on public.applications;
create policy "Employers see applications on own shifts" on public.applications for select using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()) or auth.uid() = applicant_user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
