"use client";

import { useState, type ReactNode } from "react";
import { SHOPS, StoreProvider, useStore } from "@/lib/store";
import OrderFromFactory from "@/components/sheets/OrderFromFactory";
import BillingCounter from "@/components/sheets/BillingCounter";
import ShopOrders from "@/components/sheets/ShopOrders";
import RawMaterials from "@/components/sheets/RawMaterials";
import AllTransactions from "@/components/sheets/AllTransactions";
import UserManagement from "@/components/sheets/UserManagement";
import ProductsVendors from "@/components/sheets/ProductsVendors";
import ExpensesSheet from "@/components/sheets/ExpensesSheet";
import PayrollSheet from "@/components/sheets/PayrollSheet";
import FactoryOverview from "@/components/sheets/FactoryOverview";
import DemoLogin from "@/components/auth/DemoLogin";
import {
  ProductTransfer,
  ProductInventory,
  MilkOrderSheet,
  GasOrderSheet,
} from "@/components/sheets/LedgerSheets";

type TabDef = { key: string; label: string };

// Sheets available to each role. The role comes from the signed-in profile
// (confirmed against the "Login as" choice on the login screen).
const ROLE_TABS: Record<string, TabDef[]> = {
  "Owner / Super Admin": [
    { key: "expenses", label: "Expenses" },
    { key: "transactions", label: "All Records" },
    { key: "catalog", label: "Products & Vendors" },
    { key: "team", label: "Team" },
  ],
  "General Manager": [{ key: "transactions", label: "All Records" }],
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
    { key: "catalog", label: "Products & Vendors" },
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
    <div className="flex h-screen flex-col overflow-hidden bg-surface-2">
      {/* Title bar */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-black text-white">
          R
        </div>
        <div className="leading-tight">
          <div className="text-[16px] font-extrabold tracking-tight text-ink-900">
            Real Bengal Sweets
          </div>
          <div className="text-[11px] font-semibold text-ink-500">Management System</div>
        </div>
        <div className="ml-1 hidden items-center gap-2 md:flex">
          <span className="text-ink-300">/</span>
          <span className="text-base font-semibold text-ink-700">{activeLabel}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {demo && <span className="chip neutral">Demo</span>}
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-semibold text-ink-800">{user.name}</div>
            <div className="text-[11px] font-medium text-ink-500">{user.role}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {user.name.charAt(0) || "U"}
          </div>
          <button
            onClick={authProfile ? onSignOut : () => setSignedIn(false)}
            className="h-10 rounded-lg border border-ink-200 bg-surface px-3.5 text-[15px] font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Sheet tabs — kept at the top and large so counter staff find them easily */}
      <nav className="flex items-stretch gap-1 overflow-x-auto border-b border-line bg-surface px-3">
        {tabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "whitespace-nowrap border-b-[3px] px-5 py-3 text-[15px] font-bold transition-colors " +
                (active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-500 hover:bg-ink-50 hover:text-ink-800")
              }
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Sheet canvas */}
      <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-ink-100 p-4">
        {tabs.length === 0 && (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-500">
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
        {activeTab === "expenses" && <ExpensesSheet />}
        {activeTab === "transactions" && <AllTransactions />}
        {activeTab === "catalog" && <ProductsVendors />}
        {activeTab === "team" && <TeamSection />}
      </main>

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
      <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-line bg-surface-2 p-1.5">
        {tabs.map((t) => {
          const on = t.key === current.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={
                "rounded-md px-5 py-2.5 text-[15px] font-bold transition-colors " +
                (on ? "bg-surface text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-800")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{current.render()}</div>
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
