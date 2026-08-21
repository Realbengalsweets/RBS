-- =============================================================================
-- Real Bengal Sweets — database schema (Supabase / PostgreSQL)
-- =============================================================================
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is idempotent: safe to re-run. It creates every table used by the app,
-- Row-Level Security (RLS) policies, a trigger that gives each new auth user a
-- profile, and starter reference data (locations, products, vendors).
--
-- Access model (baseline — hardened further in the security-review phase):
--   * Any signed-in staff member can READ operational data and CREATE/UPDATE it.
--   * Only the Owner / Super Admin (and General Manager) can DELETE records —
--     this is the owner's authority over cash and customer transactions.
--   * Reference data (locations, products, vendors) is managed by admins.
--   * Expenses, Payroll (employees) and user roles are admin-only.
-- =============================================================================

-- gen_random_uuid() is built into PostgreSQL 15 (Supabase) — no extension needed.

-- ---------------------------------------------------------------------------
-- Sequences for human-friendly reference numbers (O-3001, B-5001, …)
-- ---------------------------------------------------------------------------
create sequence if not exists order_seq    start 3001;
create sequence if not exists bill_seq     start 5001;
create sequence if not exists raw_seq      start 9001;
create sequence if not exists transfer_seq start 701;
create sequence if not exists milk_seq     start 201;
create sequence if not exists gas_seq      start 101;
create sequence if not exists expense_seq  start 1;
create sequence if not exists emp_seq      start 1;

-- ---------------------------------------------------------------------------
-- Profiles — one row per auth user, carrying their role & location.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  role       text not null default 'Employee'
             check (role in ('Owner / Super Admin','General Manager','Factory Admin',
                             'Warehouse Admin','Shop Admin','Purchaser','Employee','Others')),
  location   text not null default '',
  status     text not null default 'Active' check (status in ('Active','Inactive')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table if not exists public.locations (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  rate        numeric not null default 0,     -- Rs. per kg
  expiry_days integer not null default 0,     -- shelf life used to auto-calc batch expiry
  created_at  timestamptz not null default now()
);

create table if not exists public.vendors (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  category   text not null default 'Other',
  contact    text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders (shop -> factory) as slips with multiple product lines
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  ref        text not null default ('O-' || nextval('order_seq')),
  order_date date not null default current_date,
  shop       text not null,
  source     text not null default 'Factory',
  total_qty  numeric not null default 0,
  status     text not null default 'Pending'
             check (status in ('Pending','Accepted','Dispatched','Received')),
  note       text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id       uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product  text not null,
  qty_kg   numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- Bills (customer invoices) with multiple line items
-- ---------------------------------------------------------------------------
create table if not exists public.bills (
  id         uuid primary key default gen_random_uuid(),
  ref        text not null default ('B-' || nextval('bill_seq')),
  bill_time  timestamptz not null default now(),
  shop       text not null,
  customer   text not null default 'Walk-in',
  total_qty  numeric not null default 0,
  amount     numeric not null default 0,
  pay        text not null default 'Cash' check (pay in ('Cash','Online','Card')),
  created_at timestamptz not null default now()
);

create table if not exists public.bill_items (
  id      uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  item    text not null,
  qty_kg  numeric not null default 0,
  rate    numeric not null default 0,
  amount  numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- Raw-material requests
-- ---------------------------------------------------------------------------
create table if not exists public.raw_requests (
  id           uuid primary key default gen_random_uuid(),
  ref          text not null default ('R-' || nextval('raw_seq')),
  req_date     date not null default current_date,
  material     text not null,
  needed_kg    numeric not null default 0,
  available_kg numeric not null default 0,
  source       text not null default '—' check (source in ('Warehouse','Vendor','—')),
  status       text not null default 'Requested' check (status in ('Requested','Ordered','Received')),
  for_order    text not null default '',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Stock transfers between locations
-- ---------------------------------------------------------------------------
create table if not exists public.transfers (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null default ('T-' || nextval('transfer_seq')),
  transfer_date date not null default current_date,
  product       text not null,
  qty_kg        numeric not null default 0,
  from_loc      text not null default '',
  to_loc        text not null default '',
  dispatched_by text not null default '',
  received_by   text not null default '—',
  status        text not null default 'Sent' check (status in ('Sent','Dispatched','Received')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Live product inventory (kg) per location
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id       uuid primary key default gen_random_uuid(),
  product  text not null,
  location text not null,
  opening  numeric not null default 0,
  in_qty   numeric not null default 0,
  out_qty  numeric not null default 0,
  closing  numeric not null default 0,
  status   text not null default 'In stock' check (status in ('In stock','Low','Out of stock'))
);

-- ---------------------------------------------------------------------------
-- Milk & Gas purchase orders
-- ---------------------------------------------------------------------------
create table if not exists public.milk_orders (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null default ('MK-' || nextval('milk_seq')),
  order_date  date not null default current_date,
  vendor      text not null,
  qty_l       numeric not null default 0,
  rate        numeric not null default 0,
  amount      numeric not null default 0,
  payment     text not null default 'Pending' check (payment in ('Paid','Pending')),
  location    text not null default '',
  received_by text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.gas_orders (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null default ('GS-' || nextval('gas_seq')),
  order_date  date not null default current_date,
  vendor      text not null,
  qty_kg      numeric not null default 0,
  rate        numeric not null default 0,
  amount      numeric not null default 0,
  payment     text not null default 'Pending' check (payment in ('Paid','Pending')),
  location    text not null default '',
  received_by text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Expenses ledger (mirrors the client's real Excel sheet)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  sl_no           text not null default ('P.' || lpad(nextval('expense_seq')::text, 5, '0')),
  month           text not null default '',
  exp_date        text not null default '',
  amount          numeric not null default 0,
  item            text not null default '',
  qty             text not null default '',
  unit            text not null default 'Kg',
  vendor          text not null default 'NA',
  payment_status  text not null default 'Pending' check (payment_status in ('Paid','Pending')),
  payment_details text not null default '',
  category        text not null default '',
  sub_category    text not null default '',
  location        text not null default '',
  received_by     text not null default '',
  checked_by      text not null default '',
  bill            text not null default 'No',
  comments        text not null default '',
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Employees / payroll
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id         uuid primary key default gen_random_uuid(),
  code       text not null default ('EMP-' || lpad(nextval('emp_seq')::text, 3, '0')),
  name       text not null default '',
  assignment text not null default '',
  salary     numeric not null default 0,
  advance    numeric not null default 0,
  club       text not null default '',
  status     text not null default 'Pending' check (status in ('Paid','Pending')),
  created_at timestamptz not null default now()
);

-- Owner-managed salary clubs (the groupings shown on the Payroll screen).
create table if not exists public.salary_clubs (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpful indexes for child tables
-- ---------------------------------------------------------------------------
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists bill_items_bill_id_idx   on public.bill_items (bill_id);

-- ---------------------------------------------------------------------------
-- is_admin() — true for Owner / Super Admin and General Manager.
-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('Owner / Super Admin', 'General Manager')
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

-- Profiles: a user sees their own row; admins see and manage all.
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_admin());

-- Operational tables: staff read/create/update; only admins delete.
do $$
declare t text;
begin
  foreach t in array array['orders','order_items','bills','bill_items','raw_requests',
                           'transfers','inventory','milk_orders','gas_orders']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', t||'_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t||'_del', t);
  end loop;
end $$;

-- Reference tables: everyone reads; only admins write.
do $$
declare t text;
begin
  foreach t in array array['locations','products','vendors','salary_clubs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t||'_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t||'_del', t);
  end loop;
end $$;

-- Sensitive tables (owner-only screens): admins only, for every action.
do $$
declare t text;
begin
  foreach t in array array['expenses','employees']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin())', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t||'_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t||'_del', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Give every new auth user a profile automatically (default role Employee).
-- The Super Admin then sets their real role in User Management.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'Employee'),
    coalesce(new.raw_user_meta_data ->> 'location', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Starter reference data (editable in the app afterwards).
-- No fake transactions/expenses/employees are seeded — the ledgers start clean.
-- ---------------------------------------------------------------------------
insert into public.locations (name) values
  ('Factory'), ('Warehouse 1'), ('Warehouse 2'), ('Shop 1'), ('Shop 2'), ('Shop 3')
on conflict (name) do nothing;

insert into public.products (name, rate, expiry_days) values
  ('Kaju Katli', 800, 20),
  ('Gulab Jamun', 350, 5),
  ('Rasgulla', 320, 4),
  ('Soan Papdi', 250, 30),
  ('Milk Cake', 400, 7),
  ('Motichoor Laddu', 450, 15)
on conflict (name) do nothing;

insert into public.vendors (name, category, contact) values
  ('Sonali Dairy', 'Milk & Khoya', '98xxxxxx11'),
  ('Metro Wholesale', 'Grocery', '98xxxxxx22'),
  ('HP Gas', 'Fuel / Gas', '1800-xxxxxx'),
  ('Kolkata Dry Fruits', 'Dry fruits', '90xxxxxx33')
on conflict (name) do nothing;

-- =============================================================================
-- After running this file:
--   1. Create your first user (Dashboard → Authentication → Users → Add user),
--      or sign up from the app's /login screen.
--   2. Promote that user to Owner / Super Admin:
--        update public.profiles
--        set role = 'Owner / Super Admin', name = 'Owner', location = 'All locations'
--        where id = (select id from auth.users order by created_at limit 1);
--   3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.
-- =============================================================================
