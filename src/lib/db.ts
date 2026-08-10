"use client";

/**
 * Data-access layer for the Supabase-backed (real) mode.
 *
 * Maps between the snake_case database rows and the app's camelCase types.
 * Used by the shop-admin screens first (products, locations, bills, orders);
 * the rest of the modules are wired the same way in later phases.
 */
import { getSupabase } from "@/lib/supabase/client";
import type { Bill, BillItem, FactoryOrder, OrderItem, PayMode, Product } from "@/lib/store";

/* ------------------------------- Products -------------------------------- */
type ProductRow = { id: string; name: string; rate: number; expiry_days: number };

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("id,name,rate,expiry_days")
    .order("name")
    .returns<ProductRow[]>();
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    rate: Number(p.rate),
    expiryDays: p.expiry_days,
  }));
}

/* ------------------------------ Locations -------------------------------- */
export async function listLocations(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("locations")
    .select("name")
    .order("created_at")
    .returns<{ name: string }[]>();
  if (error) throw error;
  return (data ?? []).map((l) => l.name);
}

/* -------------------------------- Bills ---------------------------------- */
type BillRow = {
  ref: string;
  bill_time: string;
  shop: string;
  customer: string;
  total_qty: number;
  amount: number;
  pay: PayMode;
  bill_items: { item: string; qty_kg: number; rate: number; amount: number }[];
};

export async function listBillsForShop(shop: string): Promise<Bill[]> {
  const { data, error } = await getSupabase()
    .from("bills")
    .select("ref,bill_time,shop,customer,total_qty,amount,pay,bill_items(item,qty_kg,rate,amount)")
    .eq("shop", shop)
    .order("bill_time", { ascending: false })
    .returns<BillRow[]>();
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.ref,
    time: new Date(b.bill_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    shop: b.shop,
    customer: b.customer,
    items: (b.bill_items ?? []).map((i) => ({
      item: i.item,
      qtyKg: Number(i.qty_kg),
      rate: Number(i.rate),
      amount: Number(i.amount),
    })),
    qtyKg: Number(b.total_qty),
    amount: Number(b.amount),
    pay: b.pay,
  }));
}

export async function createBill(
  shop: string,
  customer: string,
  items: BillItem[],
  pay: PayMode,
): Promise<void> {
  if (items.length === 0) return;
  const supabase = getSupabase();
  const amount = items.reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const qtyKg = items.reduce((a, l) => a + (Number(l.qtyKg) || 0), 0);

  const { data, error } = await supabase
    .from("bills")
    .insert({ shop, customer: customer || "Walk-in", total_qty: qtyKg, amount, pay })
    .select("id")
    .single();
  if (error) throw error;

  const billId = (data as { id: string }).id;
  const rows = items.map((l) => ({
    bill_id: billId,
    item: l.item,
    qty_kg: l.qtyKg,
    rate: l.rate,
    amount: l.amount,
  }));
  const { error: itemsError } = await supabase.from("bill_items").insert(rows);
  if (itemsError) throw itemsError;
}

/* -------------------------------- Orders --------------------------------- */
type OrderRow = {
  ref: string;
  order_date: string;
  shop: string;
  source: string;
  total_qty: number;
  status: FactoryOrder["status"];
  note: string;
  order_items: { product: string; qty_kg: number }[];
};

export async function listOrdersForShop(shop: string): Promise<FactoryOrder[]> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("ref,order_date,shop,source,total_qty,status,note,order_items(product,qty_kg)")
    .eq("shop", shop)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.ref,
    date: o.order_date,
    shop: o.shop,
    source: o.source,
    items: (o.order_items ?? []).map((i) => ({ product: i.product, qtyKg: Number(i.qty_kg) })),
    qtyKg: Number(o.total_qty),
    status: o.status,
    note: o.note,
  }));
}

export async function createOrder(
  shop: string,
  source: string,
  items: OrderItem[],
): Promise<void> {
  if (items.length === 0) return;
  const supabase = getSupabase();
  const qtyKg = items.reduce((a, l) => a + (Number(l.qtyKg) || 0), 0);

  const { data, error } = await supabase
    .from("orders")
    .insert({ shop, source, total_qty: qtyKg, status: "Pending", note: "" })
    .select("id")
    .single();
  if (error) throw error;

  const orderId = (data as { id: string }).id;
  const rows = items.map((l) => ({ order_id: orderId, product: l.product, qty_kg: l.qtyKg }));
  const { error: itemsError } = await supabase.from("order_items").insert(rows);
  if (itemsError) throw itemsError;
}
