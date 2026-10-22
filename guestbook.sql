create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 24),
  note text not null check (char_length(btrim(note)) between 1 and 240),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

revoke all on table public.guestbook from public, anon, authenticated;
grant select, insert on table public.guestbook to anon;

drop policy if exists "Anyone can read guestbook entries" on public.guestbook;
create policy "Anyone can read guestbook entries"
  on public.guestbook for select to anon
  using (true);

drop policy if exists "Visitors can add guestbook entries" on public.guestbook;
create policy "Visitors can add guestbook entries"
  on public.guestbook for insert to anon
  with check (
    char_length(btrim(name)) between 1 and 24
    and char_length(btrim(note)) between 1 and 240
  );
