/**
 * Hand-written database types mirroring supabase/schema.sql.
 *
 * For a fully accurate, always-in-sync version you can regenerate this from the
 * live project once it exists:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Role =
  | "Owner / Super Admin"
  | "General Manager"
  | "Factory Admin"
  | "Warehouse Admin"
  | "Shop Admin"
  | "Purchaser"
  | "Employee"
  | "Others";

export type OrderStatus = "Pending" | "Accepted" | "Dispatched" | "Received";
export type PayMode = "Cash" | "Online" | "Card";
export type PayStatus = "Paid" | "Pending";
export type RawSource = "Warehouse" | "Vendor" | "—";
export type RawStatus = "Requested" | "Ordered" | "Received";
export type TransferStatus = "Sent" | "Dispatched" | "Received";
export type StockStatus = "In stock" | "Low" | "Out of stock";

/** Every table exposes a full Row plus loose Insert/Update shapes. */
type TableOf<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  name: string;
  role: Role;
  location: string;
  status: "Active" | "Inactive";
  created_at: string;
};

export type LocationRow = { id: string; name: string; created_at: string };
export type ProductRow = { id: string; name: string; rate: number; expiry_days: number; created_at: string };
export type VendorRow = { id: string; name: string; category: string; contact: string; created_at: string };

export type OrderRow = {
  id: string;
  ref: string;
  order_date: string;
  shop: string;
  source: string;
  total_qty: number;
  status: OrderStatus;
  note: string;
  created_at: string;
};
export type OrderItemRow = { id: string; order_id: string; product: string; qty_kg: number };

export type BillRow = {
  id: string;
  ref: string;
  bill_time: string;
  shop: string;
  customer: string;
  total_qty: number;
  amount: number;
  pay: PayMode;
  created_at: string;
};
export type BillItemRow = { id: string; bill_id: string; item: string; qty_kg: number; rate: number; amount: number };

export type RawRequestRow = {
  id: string;
  ref: string;
  req_date: string;
  material: string;
  needed_kg: number;
  available_kg: number;
  source: RawSource;
  status: RawStatus;
  for_order: string;
  created_at: string;
};

export type TransferRow = {
  id: string;
  ref: string;
  transfer_date: string;
  product: string;
  qty_kg: number;
  from_loc: string;
  to_loc: string;
  dispatched_by: string;
  received_by: string;
  status: TransferStatus;
  created_at: string;
};

export type InventoryRow = {
  id: string;
  product: string;
  location: string;
  opening: number;
  in_qty: number;
  out_qty: number;
  closing: number;
  status: StockStatus;
};

export type MilkOrderRow = {
  id: string;
  ref: string;
  order_date: string;
  vendor: string;
  qty_l: number;
  rate: number;
  amount: number;
  payment: PayStatus;
  location: string;
  received_by: string;
  created_at: string;
};

export type GasOrderRow = {
  id: string;
  ref: string;
  order_date: string;
  vendor: string;
  qty_kg: number;
  rate: number;
  amount: number;
  payment: PayStatus;
  location: string;
  received_by: string;
  created_at: string;
};

export type ExpenseRow = {
  id: string;
  sl_no: string;
  month: string;
  exp_date: string;
  amount: number;
  item: string;
  qty: string;
  unit: string;
  vendor: string;
  payment_status: PayStatus;
  payment_details: string;
  category: string;
  sub_category: string;
  location: string;
  received_by: string;
  checked_by: string;
  bill: string;
  comments: string;
  created_at: string;
};

export type EmployeeRow = {
  id: string;
  code: string;
  name: string;
  assignment: string;
  salary: number;
  advance: number;
  club: string;
  status: PayStatus;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableOf<ProfileRow>;
      locations: TableOf<LocationRow>;
      products: TableOf<ProductRow>;
      vendors: TableOf<VendorRow>;
      orders: TableOf<OrderRow>;
      order_items: TableOf<OrderItemRow>;
      bills: TableOf<BillRow>;
      bill_items: TableOf<BillItemRow>;
      raw_requests: TableOf<RawRequestRow>;
      transfers: TableOf<TransferRow>;
      inventory: TableOf<InventoryRow>;
      milk_orders: TableOf<MilkOrderRow>;
      gas_orders: TableOf<GasOrderRow>;
      expenses: TableOf<ExpenseRow>;
      employees: TableOf<EmployeeRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
