-- ---------------------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query)
-- to enable persistent, owner-managed salary clubs on the Payroll screen.
--
-- Without this table the Payroll clubs still work in the browser, but a club
-- with no members yet won't survive a page refresh. Running this makes every
-- added club persist for all users.
-- ---------------------------------------------------------------------------

create table if not exists public.salary_clubs (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

-- Read by any signed-in user; only admins (Owner / Super Admin) can change.
alter table public.salary_clubs enable row level security;

drop policy if exists salary_clubs_sel on public.salary_clubs;
drop policy if exists salary_clubs_ins on public.salary_clubs;
drop policy if exists salary_clubs_upd on public.salary_clubs;
drop policy if exists salary_clubs_del on public.salary_clubs;

create policy salary_clubs_sel on public.salary_clubs
  for select to authenticated using (true);
create policy salary_clubs_ins on public.salary_clubs
  for insert to authenticated with check (public.is_admin());
create policy salary_clubs_upd on public.salary_clubs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy salary_clubs_del on public.salary_clubs
  for delete to authenticated using (public.is_admin());
