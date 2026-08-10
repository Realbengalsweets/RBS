"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Field, inputCls, selectCls } from "@/components/ui";
import { useShopData } from "@/lib/useShopData";

type CartLine = { key: number; product: string; qtyKg: number };

const statusTone = (s: string) =>
  s === "Received" ? "ok" : s === "Pending" ? "warn" : "info";

export default function OrderFromFactory({ shop }: { shop: string }) {
  const { products, locations, orders, createOrder } = useShopData(shop);

  const [product, setProduct] = useState("");
  const [qty, setQty] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const nextKey = useRef(1);
  // Order source: the factory, or a warehouse for ready-made packaged goods.
  const sources = useMemo(() => locations.filter((l) => !/shop/i.test(l)), [locations]);
  const [source, setSource] = useState("Factory");

  const rows = orders;
  const cartQty = cart.reduce((a, l) => a + l.qtyKg, 0);

  // Default the product once the catalogue loads (Supabase mode loads async).
  useEffect(() => {
    if (!product && products[0]) setProduct(products[0].name);
  }, [products, product]);

  function addLine() {
    const q = parseFloat(qty);
    if (!product || !q || q <= 0) return;
    setCart((c) => {
      // Merge into an existing line for the same product instead of duplicating.
      const found = c.find((l) => l.product === product);
      if (found) return c.map((l) => (l === found ? { ...l, qtyKg: l.qtyKg + q } : l));
      return [...c, { key: nextKey.current++, product, qtyKg: q }];
    });
    setQty("");
  }

  function removeLine(key: number) {
    setCart((c) => c.filter((l) => l.key !== key));
  }

  function submit() {
    if (cart.length === 0) return;
    createOrder(source, cart.map((l) => ({ product: l.product, qtyKg: l.qtyKg })));
    setCart([]);
    setQty("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-5">
        {/* ---------------------------- New order --------------------------- */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-bold tracking-tight text-ink-800">New Order</h2>
            <span className="chip neutral">{shop}</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
            {/* Where to order from — factory or a warehouse */}
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Order from</span>
              <select
                className={`${selectCls} w-full sm:w-64`}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {sources.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* Add a product line */}
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Product">
                  <select className={`${selectCls} min-w-48`} value={product} onChange={(e) => setProduct(e.target.value)}>
                    {products.map((p) => (
                      <option key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity (kg)">
                  <input
                    className={`${inputCls} w-28`}
                    type="number"
                    min="0"
                    step="any"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLine()}
                    placeholder="e.g. 20"
                  />
                </Field>
                <button
                  onClick={addLine}
                  className="h-9 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                >
                  + Add item
                </button>
              </div>
            </div>

            {/* Cart */}
            {cart.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-ink-200 py-10 text-sm text-ink-400">
                No items yet — add the products this shop needs from the factory.
              </div>
            ) : (
              <div className="divide-y divide-line rounded-lg border border-line">
                {cart.map((l) => (
                  <div key={l.key} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 text-sm font-semibold text-ink-800">{l.product}</div>
                    <div className="text-sm font-bold text-ink-800">{l.qtyKg} kg</div>
                    <button
                      onClick={() => removeLine(l.key)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-red-50 hover:text-danger"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total + place order */}
          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-2 px-5 py-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Total quantity</div>
              <div className="text-2xl font-black text-ink-900">{cartQty} kg</div>
            </div>
            <button
              onClick={submit}
              disabled={cart.length === 0}
              className="h-12 rounded-xl bg-brand-600 px-7 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Place order{cart.length > 0 ? ` · ${cart.length} item${cart.length > 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </section>

        {/* --------------------------- Recent orders ------------------------ */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-bold tracking-tight text-ink-800">Recent Orders</h2>
            <span className="text-xs font-medium text-ink-500">{rows.length} orders</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {rows.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-400">
                No orders placed yet.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((o) => (
                  <li key={o.id} className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink-800">
                          {o.items.map((i) => i.product).join(", ")}
                        </div>
                        <div className="truncate text-xs text-ink-500">
                          from {o.source} · {o.id} · {o.date} · {o.qtyKg} kg · {o.items.length} item{o.items.length > 1 ? "s" : ""}
                        </div>
                      </div>
                      <span className={`chip ${statusTone(o.status)}`}>{o.status}</span>
                    </div>
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
