"use client";

import { useState, type ReactNode } from "react";
import { SHOPS, StoreProvider, useStore } from "@/lib/store";
import OrderFromFactory from "@/components/sheets/OrderFromFactory";
import BillingCounter from "@/components/sheets/BillingCounter";
import ShopOrders from "@/components/sheets/ShopOrders";
import RawMaterials from "@/components/sheets/RawMaterials";
import AllTransactions from "@/components/sheets/AllTransactions";
import UserManagement from "@/components/sheets/UserManagement";
import ExpensesSheet from "@/components/sheets/ExpensesSheet";
import ProductsSheet from "@/components/sheets/ProductsSheet";
import VendorsSheet from "@/components/sheets/VendorsSheet";
import Dashboard from "@/components/sheets/Dashboard";
import PayrollSheet from "@/components/sheets/PayrollSheet";
import FactoryOverview from "@/components/sheets/FactoryOverview";
import DemoLogin from "@/components/auth/DemoLogin";
import { NavIcon } from "@/components/NavIcons";
import {
  ProductTransfer,
  ProductInventory,
  MilkOrderSheet,
  GasOrderSheet,
} from "@/components/sheets/LedgerSheets";

type TabDef = { key: string; label: string };

// Sheets available to each role. A user's role (set by the Super Admin on their
// account) decides this — the user never picks it at login.
const ROLE_TABS: Record<string, TabDef[]> = {
  "Owner / Super Admin": [
    { key: "dashboard", label: "Dashboard" },
    { key: "expenses", label: "Expenses" },
    { key: "transactions", label: "All Records" },
    { key: "products", label: "Products" },
    { key: "vendors", label: "Vendors" },
    { key: "team", label: "Team" },
  ],
  "General Manager": [
    { key: "dashboard", label: "Dashboard" },
    { key: "transactions", label: "All Records" },
  ],
  "Factory Admin": [
    { key: "overview", label: "Overview" },
    { key: "shopOrders", label: "Shop Orders" },
    { key: "transfer", label: "Product Transfer" },
    { key: "inventory", label: "Product Inventory" },
    { key: "supplies", label: "Supplies" },
  ],
  "Warehouse Admin": [
    { key: "transfer", label: "Product Transfer" },
    { key: "inventory", label: "Product Inventory" },
    { key: "raw", label: "Raw Materials" },
  ],
  "Shop Admin": [
    { key: "order", label: "Order from Factory" },
    { key: "billing", label: "Billing Counter" },
  ],
  Purchaser: [
    { key: "raw", label: "Raw Materials" },
    { key: "products", label: "Products" },
    { key: "vendors", label: "Vendors" },
  ],
};

/** When signed in via Supabase, role & location come from the user's profile. */
type AuthProfile = { name: string; role: string; location: string };

export default function AppShell({
  authProfile,
  onSignOut,
}: {
  authProfile?: AuthProfile;
  onSignOut?: () => void;
} = {}) {
  return (
    <StoreProvider>
      <Workbook authProfile={authProfile} onSignOut={onSignOut} />
    </StoreProvider>
  );
}

function Workbook({
  authProfile,
  onSignOut,
}: {
  authProfile?: AuthProfile;
  onSignOut?: () => void;
}) {
  const { db } = useStore();
  const [userId, setUserId] = useState(db.users[0]?.id);
  // Demo mode shows a login page (account dropdown) before entering the app.
  const demo = !authProfile;
  const [signedIn, setSignedIn] = useState(false);

  const demoUser = db.users.find((u) => u.id === userId) ?? db.users[0];
  // Auth mode: the signed-in profile drives role & location.
  // Demo mode: the "Signed in as" switcher does.
  const user = authProfile ?? demoUser;
  const tabs = ROLE_TABS[user.role] ?? [];
  const [tab, setTab] = useState(tabs[0]?.key ?? "");

  // The shop is taken from the account (not chosen). Fall back for non-shop roles.
  const shop = SHOPS.includes(user.location) ? user.location : SHOPS[0];

  function signInAs(id: string) {
    const next = db.users.find((u) => u.id === id);
    setUserId(id);
    const nextTabs = ROLE_TABS[next?.role ?? ""] ?? [];
    setTab(nextTabs[0]?.key ?? "");
  }

  // keep the active tab valid if the user list changes
  const activeTab = tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key ?? "";
  const activeLabel = tabs.find((t) => t.key === activeTab)?.label ?? "";

  // Demo mode: show the account-picker login until the user signs in.
  if (demo && !signedIn) {
    return (
      <DemoLogin
        users={db.users}
        onSignIn={(id) => {
          signInAs(id);
          setSignedIn(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ink-100">
      {/* ---------------------------------------------------------------
       * Sidebar — dark, icon+label nav with an active pill (reference look)
       * ------------------------------------------------------------- */}
      <aside className="flex w-16 flex-col bg-ink-900 lg:w-64">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-3 lg:px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 text-lg font-black text-white shadow-[var(--shadow-brand)]">
            R
          </div>
          <div className="hidden leading-tight lg:block">
            <div className="text-[15px] font-extrabold tracking-tight text-white">Real Bengal Sweets</div>
            <div className="text-[11px] font-semibold text-ink-400">Management System</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 lg:px-3">
          {tabs.map((t) => {
            const active = t.key === activeTab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                title={t.label}
                className={
                  "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-150 " +
                  (active
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[var(--shadow-brand)]"
                    : "text-ink-400 hover:bg-white/5 hover:text-white")
                }
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center">
                  <NavIcon name={t.key} />
                </span>
                <span className="hidden truncate lg:block">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer badge */}
        <div className="hidden px-4 py-4 lg:block">
          <div className="rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-tight text-ink-400">
            <div className="font-bold text-ink-200">{demo ? "Demo preview" : "Live workspace"}</div>
            <div className="mt-0.5">Real Bengal Sweets · v1</div>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------
       * Main column — top bar + content
       * ------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-5 shadow-sm backdrop-blur">
          <div className="min-w-0">
            <div className="truncate text-[18px] font-extrabold tracking-tight text-ink-900">{activeLabel}</div>
            <div className="text-[11px] font-medium text-ink-500">{user.role}</div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {demo && <span className="chip neutral">Demo</span>}
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold text-ink-800">{user.name}</div>
              <div className="text-[11px] font-medium text-ink-500">{user.location}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 ring-2 ring-brand-50 ring-offset-1 ring-offset-surface">
              {user.name.charAt(0) || "U"}
            </div>
            <button
              onClick={authProfile ? onSignOut : () => setSignedIn(false)}
              className="btn btn-outline btn-sm"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Sheet canvas */}
        <main className="flex min-h-0 flex-1 flex-col overflow-auto p-5">
          <div key={activeTab} className="fade-in flex min-h-0 flex-1 flex-col">
            {tabs.length === 0 && (
              <div className="card p-6 text-sm text-ink-500">
                No sheets are configured for the “{user.role}” role in this demo yet.
              </div>
            )}

            {activeTab === "order" && <OrderFromFactory shop={shop} />}
            {activeTab === "billing" && <BillingCounter shop={shop} />}
            {activeTab === "overview" && <FactoryOverview />}
            {activeTab === "shopOrders" && <ShopOrders />}
            {activeTab === "raw" && <RawMaterials />}
            {activeTab === "transfer" && <ProductTransfer />}
            {activeTab === "inventory" && <ProductInventory />}
            {activeTab === "supplies" && <SuppliesSection />}
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "expenses" && <ExpensesSheet />}
            {activeTab === "transactions" && <AllTransactions />}
            {activeTab === "products" && <ProductsSheet />}
            {activeTab === "vendors" && <VendorsSheet />}
            {activeTab === "team" && <TeamSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Grouped sections — a single tab that holds a few closely-related sheets,
 * switched with a segmented control (keeps the workbook tidy for the user).
 * ------------------------------------------------------------------------- */

type SubTab = { key: string; label: string; render: () => ReactNode };

function SectionTabs({ tabs }: { tabs: SubTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-line bg-surface-2 p-1.5 shadow-xs">
        {tabs.map((t) => {
          const on = t.key === current.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={
                "rounded-lg px-5 py-2.5 text-[15px] font-bold transition-all duration-150 active:scale-95 " +
                (on
                  ? "bg-surface text-brand-700 shadow-sm"
                  : "text-ink-500 hover:bg-surface/60 hover:text-ink-800")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div key={current.key} className="fade-in flex min-h-0 flex-1 flex-col overflow-auto">
        {current.render()}
      </div>
    </div>
  );
}

/** Super Admin: user accounts + payroll in one place. */
function TeamSection() {
  return (
    <SectionTabs
      tabs={[
        { key: "users", label: "Users & Roles", render: () => <UserManagement /> },
        { key: "payroll", label: "Payroll", render: () => <PayrollSheet /> },
      ]}
    />
  );
}

/** Factory: raw materials, milk and gas purchases in one place. */
function SuppliesSection() {
  return (
    <SectionTabs
      tabs={[
        { key: "raw", label: "Raw Materials", render: () => <RawMaterials /> },
        { key: "milk", label: "Milk Order", render: () => <MilkOrderSheet /> },
        { key: "gas", label: "Gas Order", render: () => <GasOrderSheet /> },
      ]}
    />
  );
}
