-- Voer dit uit in Supabase SQL Editor voor profielfoto's.
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Users upload own profile photo" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own profile photo" on storage.objects
for update to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public can view profile photos" on storage.objects
for select to public
using (bucket_id = 'profile-photos');

insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do nothing;

create policy "Users upload own identity document" on storage.objects
for insert to authenticated
with check (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users view own identity document" on storage.objects
for select to authenticated
using (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);
