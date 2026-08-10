# Backend setup (Supabase) — Phase 1

This app runs in **two modes**:

- **Demo mode** (default): no backend. All data lives in memory and resets on
  refresh. This is what runs today with no configuration.
- **Connected mode**: once a Supabase project is configured, the app shows a
  **login screen** and reads each user's **role & location** from the database.

Mode is chosen automatically: if `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the app uses Supabase; otherwise it
stays in demo mode.

> **Scope of Phase 1:** login, roles, and the schema are wired. The individual
> sheets (Expenses, Orders, Billing, …) still read the demo dataset — connecting
> each of those to the database is the next phase.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in with the **owner's
   production email** (this account owns the data).
2. **New project** → name it (e.g. `real-bengal-sweets`), choose a region close
   to you (**Mumbai** or **Singapore**), and set a strong database password
   (save it in the owner's password manager).
3. Wait for the project to finish provisioning (~2 minutes).

## 2. Create the tables

1. In the project, open **SQL Editor → New query**.
2. Copy the entire contents of [`supabase/schema.sql`](../supabase/schema.sql)
   into the editor and click **Run**.
3. You should see "Success". This creates every table, security policy, the
   new-user trigger, and starter data (locations, products, vendors). It is safe
   to re-run.

## 3. Create the first user (the Owner)

1. Open **Authentication → Users → Add user**.
2. Enter the owner's email and a password, and tick **Auto Confirm User**.
3. Open **SQL Editor** again and promote that user to Super Admin:

   ```sql
   update public.profiles
   set role = 'Owner / Super Admin', name = 'Owner', location = 'All locations'
   where id = (select id from auth.users order by created_at limit 1);
   ```

## 4. Get the API keys

1. Open **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
   (The anon key is safe to ship to the browser — Row-Level Security protects
   the data. Never expose the `service_role` key.)

## 5. Point the app at the project

1. In `RBS-master/`, create a file named **`.env.local`**:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

2. Restart the dev server (`npm run dev`). Env changes are only picked up on
   restart.

## 6. Log in

Open the app — you'll now see the **login screen**. Sign in with the owner's
email and password. You'll land on the Owner / Super Admin workbook.

---

## Adding more staff accounts

For each new person:

1. **Authentication → Users → Add user** (email + password, Auto Confirm).
2. They automatically get a profile with the role **Employee**. Set their real
   role and location in SQL for now:

   ```sql
   update public.profiles
   set role = 'Shop Admin', location = 'Shop 1', name = 'Aarti'
   where id = (select id from auth.users where email = 'aarti@example.com');
   ```

   (Managing this from the **Team → Users & Roles** screen becomes possible once
   that screen is wired to the database in the next phase.)

Valid roles: `Owner / Super Admin`, `General Manager`, `Factory Admin`,
`Warehouse Admin`, `Shop Admin`, `Purchaser`, `Employee`, `Others`.

---

## Security model (baseline)

- **Read**: any signed-in staff member can read operational data.
- **Create / update**: any signed-in staff member (they do their jobs).
- **Delete**: only **Owner / Super Admin** and **General Manager** — the owner's
  authority over cash and customer records.
- **Reference data** (locations, products, vendors): managed by admins only.
- **Expenses & Payroll**: admin-only, even to read.

Per-location hardening (e.g. Shop 1 staff see only Shop 1) is planned for the
security-review phase.

## Regenerating types (optional)

The TypeScript types in `src/lib/database.types.ts` are hand-written to match
`supabase/schema.sql`. To regenerate them from the live project instead:

```bash
npx supabase gen types typescript --project-id YOUR-PROJECT-ref > src/lib/database.types.ts
```

## Troubleshooting

- **Still seeing the demo / no login screen** → `.env.local` isn't being read.
  Confirm the file is in `RBS-master/` (next to `package.json`), the variable
  names are exact, and you restarted `npm run dev`.
- **"Setting up your profile…" never finishes** → the signed-in user has no row
  in `profiles`. Re-run the schema (the trigger creates profiles for new users)
  and confirm the promote-to-Owner SQL ran.
- **Login says invalid credentials** → the user isn't confirmed. Re-add with
  **Auto Confirm User**, or confirm them under Authentication → Users.
