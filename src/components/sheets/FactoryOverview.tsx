"use client";

import { useStore } from "@/lib/store";
import { StatCard } from "@/components/ui";

const statusTone = (s: string) =>
  s === "Received" ? "ok" : s === "Pending" ? "warn" : "info";

const Dot = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

/** Factory manager landing view — the day's numbers and the orders to act on. */
export default function FactoryOverview() {
  const { db, setOrderStatus } = useStore();

  const toAccept = db.orders.filter((o) => o.status === "Pending");
  const toDispatch = db.orders.filter((o) => o.status === "Accepted");
  const stockAlerts = db.inventory.filter((i) => i.status === "Low" || i.status === "Out of stock");
  const rawPending = db.raw.filter((r) => r.status === "Requested");
  const needAction = db.orders.filter((o) => o.status === "Pending" || o.status === "Accepted");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders to accept" value={toAccept.length} icon={<Dot />} iconTone="warn" hint="awaiting review" />
        <StatCard label="Ready to dispatch" value={toDispatch.length} icon={<Dot />} iconTone="info" hint="accepted orders" />
        <StatCard label="Stock alerts" value={stockAlerts.length} icon={<Dot />} iconTone="danger" hint="low / out of stock" />
        <StatCard label="Raw requests" value={rawPending.length} icon={<Dot />} iconTone="brand" hint="pending materials" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {/* Orders needing action */}
        <section className="card flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-bold tracking-tight text-ink-800">Orders needing action</h2>
            <span className="text-sm font-medium text-ink-500">{needAction.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {needAction.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-400">
                Nothing waiting — all orders are handled.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {needAction.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-ink-800">
                        {o.items.map((i) => i.product).join(", ")}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {o.id} · {o.shop} · {o.qtyKg} kg
                      </div>
                    </div>
                    <span className={`chip ${statusTone(o.status)}`}>{o.status}</span>
                    {o.status === "Pending" ? (
                      <button
                        onClick={() => setOrderStatus(o.id, "Accepted")}
                        className="btn btn-primary btn-sm"
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        onClick={() => setOrderStatus(o.id, "Dispatched")}
                        className="btn btn-primary btn-sm"
                      >
                        Dispatch
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Stock alerts */}
        <section className="card flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-bold tracking-tight text-ink-800">Stock alerts</h2>
            <span className="text-sm font-medium text-ink-500">{stockAlerts.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {stockAlerts.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-400">
                All stock levels are healthy.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {stockAlerts.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-ink-800">{i.product}</div>
                      <div className="truncate text-xs text-ink-500">
                        {i.location} · {i.closing} kg left · batch {i.batch}
                      </div>
                    </div>
                    <span className={`chip ${i.status === "Out of stock" ? "danger" : "warn"}`}>{i.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
