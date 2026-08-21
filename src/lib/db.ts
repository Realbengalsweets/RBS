"use client";

/**
 * Data-access layer for the Supabase-backed (real) mode.
 *
 * Maps between the snake_case database rows and the app's camelCase types.
 * Used by the shop-admin screens first (products, locations, bills, orders);
 * the rest of the modules are wired the same way in later phases.
 */
import { getSupabase } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/database.types";
import type {
  Bill,
  BillItem,
  Employee,
  Expense,
  FactoryOrder,
  OrderItem,
  PayMode,
  Product,
  RawSource,
  RawStatus,
  User,
  Vendor,
} from "@/lib/store";

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

/* --------------------- Products & Vendors (admin CRUD) -------------------- */
export async function createProduct(name: string, rate: number, expiryDays: number): Promise<void> {
  const { error } = await getSupabase().from("products").insert({ name, rate, expiry_days: expiryDays });
  if (error) throw error;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  // undefined fields are dropped by supabase-js, so only provided fields update.
  const { error } = await getSupabase()
    .from("products")
    .update({ name: patch.name, rate: patch.rate, expiry_days: patch.expiryDays })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) throw error;
}

type VendorRow = { id: string; name: string; category: string; contact: string };

export async function listVendors(): Promise<Vendor[]> {
  const { data, error } = await getSupabase()
    .from("vendors")
    .select("id,name,category,contact")
    .order("name")
    .returns<VendorRow[]>();
  if (error) throw error;
  return (data ?? []).map((v) => ({ id: v.id, name: v.name, category: v.category, contact: v.contact }));
}

export async function createVendor(name: string, category: string, contact: string): Promise<void> {
  const { error } = await getSupabase().from("vendors").insert({ name, category, contact });
  if (error) throw error;
}

export async function updateVendor(id: string, patch: Partial<Vendor>): Promise<void> {
  const { error } = await getSupabase()
    .from("vendors")
    .update({ name: patch.name, category: patch.category, contact: patch.contact })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await getSupabase().from("vendors").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------- Expenses -------------------------------- */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type ExpenseRow = {
  id: string;
  sl_no: string;
  month: string;
  exp_date: string;
  amount: number;
  item: string;
  qty: string;
  unit: string;
  vendor: string;
  payment_status: Expense["paymentStatus"];
  payment_details: string;
  category: string;
  sub_category: string;
  location: string;
  received_by: string;
  checked_by: string;
  bill: string;
  comments: string;
};

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await getSupabase()
    .from("expenses")
    .select(
      "id,sl_no,month,exp_date,amount,item,qty,unit,vendor,payment_status,payment_details,category,sub_category,location,received_by,checked_by,bill,comments",
    )
    .order("sl_no")
    .returns<ExpenseRow[]>();
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    slNo: e.sl_no,
    month: e.month,
    date: e.exp_date,
    amount: Number(e.amount),
    item: e.item,
    qty: e.qty,
    unit: e.unit,
    vendor: e.vendor,
    paymentStatus: e.payment_status,
    paymentDetails: e.payment_details,
    category: e.category,
    subCategory: e.sub_category,
    location: e.location,
    receivedBy: e.received_by,
    checkedBy: e.checked_by,
    bill: e.bill,
    comments: e.comments,
  }));
}

/** Adds a blank expense row (auto Sl.No via DB sequence, auto month/date). */
export async function createExpense(): Promise<void> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const month = `${MON[now.getMonth()]} ${yy}`;
  const exp_date = `${now.getDate()} ${MON[now.getMonth()]} ${yy}`;
  const { error } = await getSupabase().from("expenses").insert({
    month,
    exp_date,
    amount: 0,
    item: "",
    qty: "",
    unit: "Kg",
    vendor: "NA",
    payment_status: "Pending",
    payment_details: "",
    category: "Ingredients",
    sub_category: "",
    location: "Factory",
    received_by: "",
    checked_by: "",
    bill: "No",
    comments: "",
  });
  if (error) throw error;
}

export async function updateExpense(id: string, patch: Partial<Expense>): Promise<void> {
  const { error } = await getSupabase()
    .from("expenses")
    .update({
      month: patch.month,
      exp_date: patch.date,
      amount: patch.amount,
      item: patch.item,
      qty: patch.qty,
      unit: patch.unit,
      vendor: patch.vendor,
      payment_status: patch.paymentStatus,
      payment_details: patch.paymentDetails,
      category: patch.category,
      sub_category: patch.subCategory,
      location: patch.location,
      received_by: patch.receivedBy,
      checked_by: patch.checkedBy,
      bill: patch.bill,
      comments: patch.comments,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await getSupabase().from("expenses").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------- Profiles -------------------------------- */
type ProfileListRow = { id: string; name: string; role: User["role"]; location: string; status: User["status"] };

export async function listProfiles(): Promise<User[]> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id,name,role,location,status")
    .order("name")
    .returns<ProfileListRow[]>();
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    location: p.location,
    status: p.status,
  }));
}

/* --------------------- All Records (bills + orders + raw) ----------------- */
/* Read every shop's records (not filtered) with both uuid (for edit/delete)
   and human ref (for display). */

type AllBillRow = {
  id: string;
  ref: string;
  bill_time: string;
  shop: string;
  customer: string;
  total_qty: number;
  amount: number;
  pay: PayMode;
  bill_items: { item: string }[];
};

export async function listAllBills() {
  const { data, error } = await getSupabase()
    .from("bills")
    .select("id,ref,bill_time,shop,customer,total_qty,amount,pay,bill_items(item)")
    .order("bill_time", { ascending: false })
    .returns<AllBillRow[]>();
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id,
    ref: b.ref,
    time: new Date(b.bill_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    shop: b.shop,
    customer: b.customer,
    items: (b.bill_items ?? []).map((i) => i.item).join(", "),
    qtyKg: Number(b.total_qty),
    amount: Number(b.amount),
    pay: b.pay as string,
  }));
}

type AllOrderRow = {
  id: string;
  ref: string;
  order_date: string;
  shop: string;
  total_qty: number;
  status: FactoryOrder["status"];
  order_items: { product: string }[];
};

export async function listAllOrders() {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id,ref,order_date,shop,total_qty,status,order_items(product)")
    .order("created_at", { ascending: false })
    .returns<AllOrderRow[]>();
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    ref: o.ref,
    date: o.order_date,
    shop: o.shop,
    products: (o.order_items ?? []).map((i) => i.product).join(", "),
    qtyKg: Number(o.total_qty),
    status: o.status as string,
  }));
}

type RawReqRow = {
  id: string;
  ref: string;
  req_date: string;
  material: string;
  needed_kg: number;
  source: RawSource;
  status: RawStatus;
};

export async function listRawRequests() {
  const { data, error } = await getSupabase()
    .from("raw_requests")
    .select("id,ref,req_date,material,needed_kg,source,status")
    .order("created_at", { ascending: false })
    .returns<RawReqRow[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    ref: r.ref,
    date: r.req_date,
    material: r.material,
    neededKg: Number(r.needed_kg),
    source: r.source as string,
    status: r.status as string,
  }));
}

export async function updateBillFields(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase()
    .from("bills")
    .update({
      customer: patch.customer as string | undefined,
      shop: patch.shop as string | undefined,
      pay: patch.pay as PayMode | undefined,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBill(id: string): Promise<void> {
  const { error } = await getSupabase().from("bills").delete().eq("id", id);
  if (error) throw error;
}

export async function updateOrderFields(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase()
    .from("orders")
    .update({
      shop: patch.shop as string | undefined,
      status: patch.status as FactoryOrder["status"] | undefined,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await getSupabase().from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function updateRawFields(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase()
    .from("raw_requests")
    .update({
      source: patch.source as RawSource | undefined,
      material: patch.material as string | undefined,
      needed_kg: patch.neededKg as number | undefined,
      status: patch.status as RawStatus | undefined,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRaw(id: string): Promise<void> {
  const { error } = await getSupabase().from("raw_requests").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------- Employees ------------------------------- */
type EmployeeDbRow = {
  id: string;
  code: string;
  name: string;
  assignment: string;
  salary: number;
  advance: number;
  club: string;
  status: Employee["status"];
};

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await getSupabase()
    .from("employees")
    .select("id,code,name,assignment,salary,advance,club,status")
    .order("code")
    .returns<EmployeeDbRow[]>();
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    code: e.code,
    name: e.name,
    assignment: e.assignment,
    salary: Number(e.salary),
    advance: Number(e.advance),
    club: e.club,
    status: e.status,
  }));
}

/** Adds a blank employee row (auto EMP-code via DB sequence). */
export async function createEmployee(): Promise<void> {
  const { error } = await getSupabase().from("employees").insert({
    name: "",
    assignment: "",
    salary: 0,
    advance: 0,
    club: "",
    status: "Pending",
  });
  if (error) throw error;
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<void> {
  const { error } = await getSupabase()
    .from("employees")
    .update({
      name: patch.name,
      assignment: patch.assignment,
      salary: patch.salary,
      advance: patch.advance,
      club: patch.club,
      status: patch.status,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await getSupabase().from("employees").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------- Locations (admin CRUD) ------------------------ */
export async function createLocation(name: string): Promise<void> {
  const { error } = await getSupabase().from("locations").insert({ name });
  if (error) throw error;
}

export async function deleteLocation(name: string): Promise<void> {
  const { error } = await getSupabase().from("locations").delete().eq("name", name);
  if (error) throw error;
}

/* --------------------- Profiles (admin edit role/status) ------------------ */
export async function updateProfile(id: string, patch: Partial<User>): Promise<void> {
  const { error } = await getSupabase()
    .from("profiles")
    .update({
      name: patch.name,
      role: patch.role as ProfileRow["role"] | undefined,
      location: patch.location,
      status: patch.status,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Removes the profile row (access record). The underlying auth login, if any,
    is managed from the Supabase dashboard / admin API. */
export async function deleteProfile(id: string): Promise<void> {
  const { error } = await getSupabase().from("profiles").delete().eq("id", id);
  if (error) throw error;
}

/* ----------------------- Salary clubs (owner-managed) --------------------- */
/** Lists owner-defined salary-club names. Returns [] if the table isn't set up
    yet, so Payroll still works (clubs then come from existing employees). */
export async function listSalaryClubs(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("salary_clubs")
    .select("name")
    .order("name")
    .returns<{ name: string }[]>();
  if (error) return [];
  return (data ?? []).map((r) => r.name);
}

export async function createSalaryClub(name: string): Promise<void> {
  const { error } = await getSupabase().from("salary_clubs").insert({ name });
  if (error) throw error;
}

export async function deleteSalaryClub(name: string): Promise<void> {
  const { error } = await getSupabase().from("salary_clubs").delete().eq("name", name);
  if (error) throw error;
}

/* ------------------------------- Dashboard ------------------------------- */
export type SalePoint = { at: string; shop: string; amount: number };

/** Lean sales feed for the dashboard — keeps the real timestamp (unlike the
    All-Records view, which only shows the time-of-day). */
export async function listSalesForDashboard(): Promise<SalePoint[]> {
  const { data, error } = await getSupabase()
    .from("bills")
    .select("bill_time,shop,amount")
    .order("bill_time", { ascending: false })
    .returns<{ bill_time: string; shop: string; amount: number }[]>();
  if (error) throw error;
  return (data ?? []).map((b) => ({ at: b.bill_time, shop: b.shop, amount: Number(b.amount) }));
}
