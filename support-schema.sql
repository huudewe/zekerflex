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

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "Visitors can create support tickets" on public.support_tickets;
drop policy if exists "Visitors can view own support tickets" on public.support_tickets;
drop policy if exists "Authenticated users can manage support tickets" on public.support_tickets;
drop policy if exists "Visitors can create support messages" on public.support_messages;
drop policy if exists "Ticket participants can read messages" on public.support_messages;
drop policy if exists "Authenticated users can answer messages" on public.support_messages;

create policy "Visitors can create support tickets" on public.support_tickets
  for insert with check (true);
create policy "Visitors can view own support tickets" on public.support_tickets
  for select using (visitor_id = current_setting('request.headers', true)::json->>'x-zf-visitor-id' or auth.uid() = user_id);
create policy "Authenticated users can manage support tickets" on public.support_tickets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Visitors can create support messages" on public.support_messages
  for insert with check (exists (select 1 from public.support_tickets t where t.id = ticket_id));
create policy "Ticket participants can read messages" on public.support_messages
  for select using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (auth.uid() = t.user_id or auth.role() = 'authenticated' or t.visitor_id = current_setting('request.headers', true)::json->>'x-zf-visitor-id')));
create policy "Authenticated users can answer messages" on public.support_messages
  for insert with check (auth.role() = 'authenticated' or sender_role = 'visitor');

-- For production, replace the authenticated policies with an explicit admin role in auth.users app_metadata.
