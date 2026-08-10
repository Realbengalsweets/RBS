# RBS — docs

- `RBS_Phase_Roadmap.md` (in the project workspace) is the phase-by-phase plan.
- The clickable prototype (from the earlier planning stage) is the **functional
  reference** for flows, rules, and the data model. Its look is superseded by
  the spreadsheet/data-grid design.

## Phase 0 (this commit) — design system & data-grid foundation
- Stack adopted: Next.js 16 (App Router) + React 19 + Tailwind v4 + PWA.
- Data grid: **AG Grid Community v36** (Theming API) via `src/components/DataGrid.tsx`.
- Single unified theme for all roles: tokens in `src/app/globals.css`, grid
  theme in `src/lib/gridTheme.ts`.
- App shell with top "sheet" tabs: `src/components/AppShell.tsx`.
- Demo sheets modeled on the client's real workbook (Expenses / Product
  Inventory / Product Transfer): `src/data/demoSheets.tsx`.
- Supabase client placeholder (Phase 1): `src/lib/supabase.ts` + `.env.example`.

## Run locally
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (uses --webpack for the PWA plugin)
```

> Note on AGENTS.md: this Next.js version has breaking changes. Read the bundled
> guides in `node_modules/next/dist/docs/` before writing new code.
