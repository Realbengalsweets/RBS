"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/ui";
import { useDashboard } from "@/lib/useDashboard";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const inrShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

const PIE = ["#c8791f", "#854d15", "#1d4ed8", "#15803d", "#b45309", "#0ea5e9", "#94a3b8"];

const Bag = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const Cal = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const Clock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const Wallet = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" /><circle cx="16" cy="14" r="1.3" />
  </svg>
);

function CardBox({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <div className="text-[15px] font-bold tracking-tight text-ink-800">{title}</div>
        {subtitle && <div className="text-[12px] text-ink-500">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const d = useDashboard();
  const hasSales = d.salesCount > 0;

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Sales today" value={inr(d.salesToday)} icon={<Bag />} iconTone="brand" hint="all locations" />
        <StatCard label="Sales this month" value={inr(d.salesMonth)} icon={<Cal />} iconTone="ok" hint={`${d.salesCount} bills`} />
        <StatCard label="Orders pending" value={d.ordersPending} icon={<Clock />} iconTone="warn" hint="to accept / dispatch" />
        <StatCard label="Expenses (ledger)" value={inr(d.expensesMonth)} icon={<Wallet />} iconTone="info" hint="recorded total" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardBox title="Sales trend" subtitle="Last 14 days · all locations">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8791f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#c8791f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e5e9ef" }} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis tickFormatter={inrShort} tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={56} />
                  <Tooltip formatter={(v) => [inr(Number(v)), "Sales"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e9ef", fontSize: 13 }} />
                  <Area type="monotone" dataKey="sales" stroke="#a9631a" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBox>
        </div>

        <CardBox title="Sales by location" subtitle="Share of revenue">
          <div className="h-72 w-full">
            {d.byLocation.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-ink-400">
                No sales recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.byLocation} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={2}>
                    {d.byLocation.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [inr(Number(v)), n as string]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e9ef", fontSize: 13 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBox>
      </div>

      {/* Recent transactions */}
      <CardBox title="Recent transactions" subtitle="Latest bills across all locations">
        {d.recent.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-400">
            {hasSales ? "Loading…" : "No bills yet — they'll appear here as shops start billing."}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {d.recent.map((r) => (
              <li key={r.ref} className="flex items-center gap-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-[12px] font-bold text-brand-700">
                  {r.shop?.replace(/[^0-9]/g, "") || "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-ink-800">
                    {r.ref} · {r.party || "Walk-in"}
                  </div>
                  <div className="truncate text-[12px] text-ink-500">{r.shop} · {r.at}</div>
                </div>
                <div className="text-[15px] font-bold text-ink-900">{inr(r.amount)}</div>
              </li>
            ))}
          </ul>
        )}
      </CardBox>
    </div>
  );
}
