"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type PayMode } from "@/lib/store";
import { useShopData } from "@/lib/useShopData";

const PAY_MODES: PayMode[] = ["Cash", "Online", "Card"];

type CartLine = { key: number; item: string; qtyKg: number; rate: number; amount: number };

export default function BillingCounter({ shop }: { shop: string }) {
  const { products, bills, createBill } = useShopData(shop);

  const [customer, setCustomer] = useState("");
  const [pay, setPay] = useState<PayMode>("Cash");
  const [itemText, setItemText] = useState("");
  const [qty, setQty] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const nextKey = useRef(1);

  const customerRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    customerRef.current?.focus();
  }, []);

  const rows = bills;
  const collectedToday = rows.reduce((a, b) => a + b.amount, 0);

  // Type-ahead matches: names that start with the text first, then any that contain it.
  const matches = useMemo(() => {
    const q = itemText.trim().toLowerCase();
    if (!q) return [];
    const starts = products.filter((p) => p.name.toLowerCase().startsWith(q));
    const contains = products.filter(
      (p) => !p.name.toLowerCase().startsWith(q) && p.name.toLowerCase().includes(q),
    );
    return [...starts, ...contains];
  }, [itemText, products]);

  const currentProduct = useMemo(
    () => products.find((p) => p.name.toLowerCase() === itemText.trim().toLowerCase()) ?? null,
    [itemText, products],
  );
  const rate = currentProduct?.rate ?? 0;
  const lineAmount = (parseFloat(qty) || 0) * rate;
  const cartTotal = cart.reduce((a, l) => a + l.amount, 0);

  function selectProduct(name: string) {
    setItemText(name);
    setOpen(false);
    requestAnimationFrame(() => qtyRef.current?.focus());
  }

  function addLine() {
    const p = currentProduct;
    const q = parseFloat(qty);
    if (!p || !q || q <= 0) {
      itemRef.current?.focus();
      return;
    }
    setCart((c) => [
      ...c,
      { key: nextKey.current++, item: p.name, qtyKg: q, rate: p.rate, amount: Math.round(q * p.rate) },
    ]);
    setItemText("");
    setQty("");
    setOpen(false);
    requestAnimationFrame(() => itemRef.current?.focus());
  }

  function removeLine(key: number) {
    setCart((c) => c.filter((l) => l.key !== key));
  }

  function charge() {
    if (cart.length === 0) return;
    const items = cart.map((l) => ({ item: l.item, qtyKg: l.qtyKg, rate: l.rate, amount: l.amount }));
    createBill(customer, items, pay);
    setCart([]);
    setCustomer("");
    setItemText("");
    setQty("");
    requestAnimationFrame(() => customerRef.current?.focus());
  }

  function onCustomerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      itemRef.current?.focus();
    }
  }

  function onItemKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(matches.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && matches.length > 0) {
        selectProduct((matches[highlight] ?? matches[0]).name);
      } else if (itemText.trim() === "") {
        charge(); // Enter on an empty item field finishes the bill
      } else if (currentProduct) {
        qtyRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function onQtyKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addLine();
    }
  }

  const inputBase =
    "h-12 w-full rounded-lg border border-ink-200 bg-surface px-3.5 text-base text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-5">
        {/* ---------------------------- New bill ---------------------------- */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-bold tracking-tight text-ink-800">New Bill</h2>
            <span className="chip neutral">{shop}</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
            <p className="rounded-lg bg-ink-100 px-3 py-2 text-[13px] text-ink-500">
              Keyboard: <b>Enter</b> moves Customer → Item → Qty and adds the line. Press{" "}
              <b>Enter on an empty item</b> to generate the bill.
            </p>

            {/* Customer + payment */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Customer</span>
                <input
                  ref={customerRef}
                  className={inputBase}
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  onKeyDown={onCustomerKeyDown}
                  placeholder="Walk-in (optional) — press Enter"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Payment</span>
                <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-line bg-surface-2 p-1">
                  {PAY_MODES.map((m) => {
                    const on = m === pay;
                    return (
                      <button
                        key={m}
                        onClick={() => setPay(m)}
                        className={
                          "rounded-md px-4 py-2 text-[15px] font-semibold transition-colors " +
                          (on ? "bg-surface text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-800")
                        }
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Add a line item (keyboard-first) */}
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative flex flex-1 flex-col gap-1" style={{ minWidth: 220 }}>
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Item</span>
                  <input
                    ref={itemRef}
                    className={inputBase}
                    value={itemText}
                    autoComplete="off"
                    onChange={(e) => {
                      setItemText(e.target.value);
                      setOpen(true);
                      setHighlight(0);
                    }}
                    onKeyDown={onItemKeyDown}
                    onFocus={() => itemText && setOpen(true)}
                    placeholder="Type a few letters…"
                  />
                  {open && matches.length > 0 && (
                    <ul className="absolute left-0 top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
                      {matches.map((p, i) => (
                        <li key={p.id}>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectProduct(p.name);
                            }}
                            className={
                              "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[15px] " +
                              (i === highlight ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-50")
                            }
                          >
                            <span className="font-semibold">{p.name}</span>
                            <span className="text-ink-400">₹{p.rate}/kg</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Qty (kg)</span>
                  <input
                    ref={qtyRef}
                    className={`${inputBase} w-28`}
                    type="number"
                    min="0"
                    step="any"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    onKeyDown={onQtyKeyDown}
                  />
                </label>

                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Rate</span>
                  <span className="flex h-12 min-w-24 items-center justify-end rounded-lg bg-ink-100 px-3.5 text-base font-bold text-ink-700">
                    {rate ? `₹${rate}/kg` : "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Line total</span>
                  <span className="flex h-12 min-w-24 items-center justify-end rounded-lg bg-ink-100 px-3.5 text-base font-bold text-ink-800">
                    ₹{lineAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={addLine}
                  className="h-12 rounded-lg border border-brand-200 bg-brand-50 px-4 text-base font-bold text-brand-700 transition-colors hover:bg-brand-100"
                >
                  Add item
                </button>
              </div>
              <p className="mt-2 text-[12px] text-ink-400">Price is set by the Super Admin and can&apos;t be changed here.</p>
            </div>

            {/* Cart */}
            {cart.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-ink-200 py-10 text-base text-ink-400">
                No items yet — type an item above and press Enter.
              </div>
            ) : (
              <div className="divide-y divide-line rounded-lg border border-line">
                {cart.map((l) => (
                  <div key={l.key} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold text-ink-800">{l.item}</div>
                      <div className="text-sm text-ink-500">{l.qtyKg} kg × ₹{l.rate.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="text-[15px] font-bold text-ink-800">₹{l.amount.toLocaleString("en-IN")}</div>
                    <button
                      onClick={() => removeLine(l.key)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-red-50 hover:text-danger"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total + charge */}
          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-2 px-5 py-4">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Total</div>
              <div className="text-3xl font-black text-ink-900">₹{cartTotal.toLocaleString("en-IN")}</div>
            </div>
            <button
              onClick={charge}
              disabled={cart.length === 0}
              className="h-14 rounded-xl bg-brand-600 px-8 text-lg font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate bill · ₹{cartTotal.toLocaleString("en-IN")}
            </button>
          </div>
        </section>

        {/* -------------------------- Today's bills ------------------------- */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-bold tracking-tight text-ink-800">Today&apos;s Bills</h2>
            <span className="text-sm font-medium text-ink-500">{rows.length} bills</span>
          </div>
          <div className="border-b border-line bg-brand-50 px-5 py-3">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-brand-700">Collected today</div>
            <div className="text-3xl font-black text-brand-800">₹{collectedToday.toLocaleString("en-IN")}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {rows.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-base text-ink-400">
                No bills yet today.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-ink-800">
                        {b.items.map((i) => i.item).join(", ")}
                      </div>
                      <div className="truncate text-sm text-ink-500">
                        {b.time} · {b.customer || "Walk-in"} · {b.items.length} item{b.items.length > 1 ? "s" : ""}
                      </div>
                    </div>
                    <span className={`chip ${b.pay === "Cash" ? "neutral" : "info"}`}>{b.pay}</span>
                    <div className="w-24 text-right text-[15px] font-bold text-ink-800">
                      ₹{b.amount.toLocaleString("en-IN")}
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
