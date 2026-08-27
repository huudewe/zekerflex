-- ZekerFlex complete Supabase setup
-- Run this entire file once in Supabase SQL Editor.
-- The existing public.shifts and public.applications tables are assumed to exist.

create extension if not exists pgcrypto;

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
alter table public.shifts add column if not exists starts_at timestamptz;
alter table public.shifts add column if not exists ends_at timestamptz;
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

-- Keep the oldest application when old data contains duplicates.
delete from public.applications
where id in (
  select id
  from (
    select id,
      row_number() over (
        partition by shift_id, applicant_user_id
        order by created_at asc nulls last, id asc
      ) as duplicate_number
    from public.applications
    where applicant_user_id is not null
  ) duplicates
  where duplicate_number > 1
);

create unique index if not exists applications_one_per_user_shift
on public.applications (shift_id, applicant_user_id)
where applicant_user_id is not null;

create or replace function public.accept_application(application_id_input bigint, shift_id_input bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  update public.shifts
  set status = 'vervuld'
  where id = shift_id_input
    and status = 'open'
    and user_id = auth.uid();
  claimed := found;
  if not claimed then return false; end if;

  update public.applications
  set status = 'Aangenomen'
  where id = application_id_input
    and shift_id = shift_id_input;
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

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid references auth.users(id),
  name text not null,
  email text not null,
  subject text not null default 'Chatvraag',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  visitor_id text,
  sender_role text not null check (sender_role in ('visitor', 'admin')),
  message text not null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.shift_groups (
  id uuid primary key default gen_random_uuid(),
  shift_id bigint not null references public.shifts(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 80),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.shift_group_members (
  group_id uuid not null references public.shift_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_manager boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create table if not exists public.chat_polls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  question text not null check (length(trim(question)) between 2 and 240),
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_poll_votes (
  poll_id uuid not null references public.chat_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create or replace function public.get_or_create_direct_conversation(application_id_input bigint)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id_result uuid;
  worker_id_result uuid;
  employer_id_result uuid;
begin
  select a.applicant_user_id, s.user_id into worker_id_result, employer_id_result
  from public.applications a join public.shifts s on s.id = a.shift_id
  where a.id = application_id_input;
  if auth.uid() is null or (auth.uid() <> worker_id_result and auth.uid() <> employer_id_result) then
    raise exception 'Geen toegang tot deze conversatie';
  end if;
  select id into conversation_id_result from public.direct_conversations where application_id = application_id_input;
  if conversation_id_result is null then
    insert into public.direct_conversations (application_id, worker_id, employer_id)
    values (application_id_input, worker_id_result, employer_id_result)
    returning id into conversation_id_result;
  end if;
  return conversation_id_result;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(bigint) from public;
grant execute on function public.get_or_create_direct_conversation(bigint) to authenticated;

-- Add the relation when support_messages already existed from an older schema.
alter table public.support_messages add column if not exists ticket_id uuid;
alter table public.support_messages add column if not exists conversation_id uuid;
alter table public.support_messages add column if not exists visitor_id text;
alter table public.support_messages drop constraint if exists support_messages_conversation_id_fkey;
alter table public.support_messages add column if not exists sender_type text;
alter table public.support_messages add column if not exists sender_role text;
alter table public.support_messages add column if not exists sender_name text;
alter table public.support_messages add column if not exists sender_avatar_url text;
alter table public.support_messages alter column sender_role set default 'visitor';
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'support_messages' and column_name = 'sender_type') then
    update public.support_messages set sender_role = sender_type where sender_role is null and sender_type is not null;
    alter table public.support_messages alter column sender_type set default 'visitor';
    alter table public.support_messages alter column sender_type drop not null;
  end if;
end
$$;

alter table public.shifts enable row level security;
alter table public.applications enable row level security;
alter table public.time_entries enable row level security;
alter table public.verification_requests enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.shift_groups enable row level security;
alter table public.shift_group_members enable row level security;
alter table public.chat_polls enable row level security;
alter table public.chat_poll_votes enable row level security;

-- Remove policies from older ZekerFlex scripts so this file is rerunnable.
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
drop policy if exists "Workers create own time entries" on public.time_entries;
drop policy if exists "Workers see own time entries" on public.time_entries;
drop policy if exists "Employers review time entries" on public.time_entries;
drop policy if exists "Users create own verification requests" on public.verification_requests;
drop policy if exists "Users view own verification requests" on public.verification_requests;
drop policy if exists "Participants view direct conversations" on public.direct_conversations;
drop policy if exists "Participants view direct messages" on public.direct_messages;
drop policy if exists "Participants send direct messages" on public.direct_messages;
drop policy if exists "Participants manage shift groups" on public.shift_groups;
drop policy if exists "Participants view group members" on public.shift_group_members;
drop policy if exists "Participants manage chat polls" on public.chat_polls;
drop policy if exists "Participants vote chat polls" on public.chat_poll_votes;

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
create policy "Workers cancel own applications" on public.applications
  for update using (auth.uid() = applicant_user_id)
  with check (auth.uid() = applicant_user_id and status = 'Geannuleerd');
create policy "Employers see applications on own shifts" on public.applications
  for select using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));
create policy "Employers update applications for own shifts" on public.applications
  for update using (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()))
  with check (exists (select 1 from public.shifts where shifts.id = applications.shift_id and shifts.user_id = auth.uid()));

create policy "Workers create own time entries" on public.time_entries
  for insert with check (auth.uid() = worker_id);
create policy "Workers see own time entries" on public.time_entries
  for select using (auth.uid() = worker_id);
create policy "Employers review time entries" on public.time_entries
  for all using (exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id where a.id = application_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id where a.id = application_id and s.user_id = auth.uid()));

create policy "Users create own verification requests" on public.verification_requests
  for insert with check (auth.uid() = user_id);
create policy "Users view own verification requests" on public.verification_requests
  for select using (auth.uid() = user_id);

create policy "Participants view direct conversations" on public.direct_conversations
  for select using (auth.uid() = worker_id or auth.uid() = employer_id);
create policy "Participants view direct messages" on public.direct_messages
  for select using (exists (select 1 from public.direct_conversations c where c.id = public.direct_messages.conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id)));
create policy "Participants send direct messages" on public.direct_messages
  for insert with check (auth.uid() = sender_id and exists (select 1 from public.direct_conversations c where c.id = public.direct_messages.conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id)));
create policy "Participants manage shift groups" on public.shift_groups for all using (auth.uid() = created_by or exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id where a.id = shift_id and (auth.uid() = a.applicant_user_id or auth.uid() = s.user_id))) with check (auth.uid() = created_by);
create policy "Participants view group members" on public.shift_group_members for select using (exists (select 1 from public.shift_groups g join public.applications a on a.shift_id = g.shift_id where g.id = group_id and (auth.uid() = a.applicant_user_id or auth.uid() = (select user_id from public.shifts where id = a.shift_id))));
create policy "Participants manage chat polls" on public.chat_polls for all using (exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id))) with check (auth.uid() = created_by and exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id)));
create policy "Participants vote chat polls" on public.chat_poll_votes for all using (auth.uid() = user_id and exists (select 1 from public.chat_polls p join public.direct_conversations c on c.id = p.conversation_id where p.id = poll_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id))) with check (auth.uid() = user_id and exists (select 1 from public.chat_polls p join public.direct_conversations c on c.id = p.conversation_id where p.id = poll_id and (auth.uid() = c.worker_id or auth.uid() = c.employer_id)));

-- Support policies. The visitor id is supplied by the support widget header.
drop policy if exists "Visitors can create support tickets" on public.support_tickets;
drop policy if exists "Visitors can view own support tickets" on public.support_tickets;
drop policy if exists "Visitors can update own support tickets" on public.support_tickets;
drop policy if exists "Authenticated users can manage support tickets" on public.support_tickets;
drop policy if exists "Visitors can create support messages" on public.support_messages;
drop policy if exists "Ticket participants can read messages" on public.support_messages;
drop policy if exists "Authenticated users can answer messages" on public.support_messages;

create policy "Visitors can create support tickets" on public.support_tickets
  for insert with check (true);
create policy "Visitors can view own support tickets" on public.support_tickets
  for select using (visitor_id = current_setting('request.headers', true)::json->>'x-zf-visitor-id' or auth.uid() = user_id);
create policy "Visitors can update own support tickets" on public.support_tickets
  for update using (visitor_id = current_setting('request.headers', true)::json->>'x-zf-visitor-id')
  with check (visitor_id = current_setting('request.headers', true)::json->>'x-zf-visitor-id');
create policy "Authenticated users can manage support tickets" on public.support_tickets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Visitors can create support messages" on public.support_messages
  for insert with check (exists (select 1 from public.support_tickets t where t.id = public.support_messages.ticket_id));
create policy "Ticket participants can read messages" on public.support_messages
  for select using (exists (select 1 from public.support_tickets t where t.id = public.support_messages.ticket_id and (auth.uid() = t.user_id or auth.role() = 'authenticated' or t.visitor_id = current_setting('request.headers', true)::json->>'x-zf-visitor-id')));
create policy "Authenticated users can answer messages" on public.support_messages
  for insert with check (auth.role() = 'authenticated' or sender_role = 'visitor');

-- Storage buckets for profile photos and identity documents.
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do nothing;

drop policy if exists "Users upload own profile photo" on storage.objects;
drop policy if exists "Users update own profile photo" on storage.objects;
drop policy if exists "Public can view profile photos" on storage.objects;
drop policy if exists "Users upload own identity document" on storage.objects;
drop policy if exists "Users view own identity document" on storage.objects;

create policy "Users upload own profile photo" on storage.objects
  for insert to authenticated with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own profile photo" on storage.objects
  for update to authenticated using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Public can view profile photos" on storage.objects
  for select to public using (bucket_id = 'profile-photos');
create policy "Users upload own identity document" on storage.objects
  for insert to authenticated with check (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users view own identity document" on storage.objects
  for select to authenticated using (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);
