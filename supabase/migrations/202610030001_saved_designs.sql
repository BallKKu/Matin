-- Run this migration in the Supabase SQL Editor for this project.
create table if not exists public.saved_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null unique,
  prompt text not null,
  colors text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.saved_designs enable row level security;
drop policy if exists "Users manage their own saved designs" on public.saved_designs;
create policy "Users manage their own saved designs"
  on public.saved_designs for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('saved-designs', 'saved-designs', false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png'];

drop policy if exists "Users read their own saved design images" on storage.objects;
create policy "Users read their own saved design images"
  on storage.objects for select to authenticated
  using (bucket_id = 'saved-designs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload their own saved design images" on storage.objects;
create policy "Users upload their own saved design images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'saved-designs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own saved design images" on storage.objects;
create policy "Users delete their own saved design images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'saved-designs' and (storage.foldername(name))[1] = auth.uid()::text);
