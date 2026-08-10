"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ----------------------------- Reference data ----------------------------- */

/** Seed catalogue — becomes editable `db.products` at runtime (owner-managed). */
export const PRODUCTS = [
  { name: "Kaju Katli", rate: 800, expiryDays: 20 },
  { name: "Gulab Jamun", rate: 350, expiryDays: 5 },
  { name: "Rasgulla", rate: 320, expiryDays: 4 },
  { name: "Soan Papdi", rate: 250, expiryDays: 30 },
  { name: "Milk Cake", rate: 400, expiryDays: 7 },
  { name: "Motichoor Laddu", rate: 450, expiryDays: 15 },
];

export const VENDOR_CATEGORIES = [
  "Milk & Khoya",
  "Dry fruits",
  "Grocery",
  "Vegetables & Fruits",
  "Packaging",
  "Fuel / Gas",
  "Equipment",
  "Other",
];

export const ROLES = [
  "Owner / Super Admin",
  "General Manager",
  "Factory Admin",
  "Warehouse Admin",
  "Shop Admin",
  "Purchaser",
  "Employee",
  "Others",
];

export const LOCATIONS = [
  "Factory",
  "Warehouse 1",
  "Warehouse 2",
  "Shop 1",
  "Shop 2",
  "Shop 3",
  "All locations",
  "Others",
];

export const SHOPS = ["Shop 1", "Shop 2", "Shop 3"];

/** Physical stock locations (used by transfer/inventory dropdowns). */
export const STOCK_LOCATIONS = ["Factory", "Warehouse 1", "Warehouse 2", "Shop 1", "Shop 2", "Shop 3"];

export const PAY_STATUS = ["Paid", "Pending"];

export const RAW_MATERIALS = [
  "Khoya",
  "Cashew",
  "Milk",
  "Sugar",
  "Ghee",
  "Maida (flour)",
  "Besan",
  "Cardamom",
  "Pista",
  "Packaging",
  "Other",
];

export function productRate(name: string) {
  return PRODUCTS.find((p) => p.name === name)?.rate ?? 0;
}

/* Expense ledger reference lists (from the client's real sheet). */
export const CATEGORIES = [
  "Ingredients",
  "One time Setup",
  "Fuel",
  "Staff Welfare",
  "Packaging",
  "Maintenance",
  "Miscellaneous",
];

export const SUB_CATEGORIES = [
  "Milk",
  "Vegetables",
  "Fruits",
  "Dry fruits",
  "Grocery",
  "Cng",
  "Petrol",
  "Diesel",
  "Construction",
  "Cleaning & Hygiene",
  "Utensils",
  "Repair",
  "Other",
];

export const UNITS = ["Kg", "Litre", "Pc", "Box", "Bag", "Dozen", "Packet"];

/** Salary-club options — several employees can be clubbed into one payroll line. */
export const CLUBS = ["None", "Counter Team", "Kitchen Team", "Delivery Team", "Office"];

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDay(d: Date) {
  return `${d.getDate()} ${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
function fmtMonth(d: Date) {
  return `${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
/** Derive "Apr 25" from a date string; "" if it can't be parsed. */
export function monthOf(dateStr: string) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : fmtMonth(d);
}

/* -------------------------------- Types ----------------------------------- */

export type OrderStatus = "Pending" | "Accepted" | "Dispatched" | "Received";
/** One product line on a factory order. */
export type OrderItem = { product: string; qtyKg: number };
/** One order slip from a shop — can request several products at once. */
export type FactoryOrder = {
  id: string;
  date: string;
  shop: string;
  source: string; // ordered from — Factory or a warehouse (for ready-made goods)
  items: OrderItem[];
  qtyKg: number; // total quantity across all product lines
  status: OrderStatus;
  note: string;
};

export type PayMode = "Cash" | "Online" | "Card";
/** A single line on a bill (one product). */
export type BillItem = { item: string; qtyKg: number; rate: number; amount: number };
/** One invoice — can contain several line items from the same purchase. */
export type Bill = {
  id: string;
  time: string;
  shop: string;
  customer: string;
  items: BillItem[];
  qtyKg: number; // total quantity across all line items
  amount: number; // invoice total
  pay: PayMode;
};

export type RawStatus = "Requested" | "Ordered" | "Received";
export type RawSource = "Warehouse" | "Vendor" | "—";
export type RawReq = {
  id: string;
  date: string;
  material: string;
  neededKg: number;
  availableKg: number;
  source: RawSource;
  status: RawStatus;
  forOrder: string;
};

export type User = {
  id: string;
  name: string;
  role: string;
  location: string;
  status: "Active" | "Inactive";
};

export type Product = {
  id: string;
  name: string;
  rate: number; // ₹ per kg
  expiryDays: number; // shelf life used to auto-calc batch expiry
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  contact: string;
};

/* --- Workbook ledger sheets (same style as the client's Excel tabs) --- */

export type Transfer = {
  id: string;
  date: string;
  product: string;
  batch: string; // which batch/lot is being moved
  qtyKg: number;
  from: string;
  to: string;
  dispatchedBy: string;
  receivedBy: string;
  status: "Sent" | "Dispatched" | "Received";
};

export type MilkOrder = {
  id: string;
  date: string;
  vendor: string;
  qtyL: number;
  rate: number;
  amount: number;
  payment: "Paid" | "Pending";
  location: string;
  receivedBy: string;
};

export type GasOrder = {
  id: string;
  date: string;
  vendor: string;
  qtyKg: number;
  rate: number;
  amount: number;
  payment: "Paid" | "Pending";
  location: string;
  receivedBy: string;
};

export type InvRow = {
  id: string;
  product: string;
  location: string;
  batch: string; // batch / lot number for traceability
  mfgDate: string; // manufactured on
  expiry: string; // best-before (from the product's shelf life)
  opening: number;
  inQty: number;
  outQty: number;
  closing: number;
  status: "In stock" | "Low" | "Out of stock";
};

export type Employee = {
  id: string;
  code: string; // auto EMP-001
  name: string;
  assignment: string; // location / role
  salary: number; // monthly ₹
  advance: number; // ₹ taken as advance
  club: string; // salary club (or "None")
  status: "Paid" | "Pending";
};

/** Full expense ledger row — mirrors the client's Excel "Expenses" tab. */
export type Expense = {
  id: string;
  slNo: string; // auto P.00001
  month: string; // auto from date
  date: string;
  amount: number;
  item: string;
  qty: string;
  unit: string;
  vendor: string;
  paymentStatus: "Paid" | "Pending";
  paymentDetails: string;
  category: string;
  subCategory: string;
  location: string;
  receivedBy: string;
  checkedBy: string;
  bill: string;
  comments: string;
};

export type Kind =
  | "orders"
  | "bills"
  | "raw"
  | "users"
  | "products"
  | "vendors"
  | "transfers"
  | "milk"
  | "gas"
  | "inventory"
  | "expenses"
  | "employees";

type DB = {
  orders: FactoryOrder[];
  bills: Bill[];
  raw: RawReq[];
  users: User[];
  products: Product[];
  vendors: Vendor[];
  transfers: Transfer[];
  milk: MilkOrder[];
  gas: GasOrder[];
  inventory: InvRow[];
  expenses: Expense[];
  employees: Employee[];
  locations: string[]; // editable by Super Admin — add/remove as the business grows
};

/* -------------------------------- Seed ------------------------------------ */

function seed(): DB {
  return {
    orders: [
      // A shop ordering two products at once — ONE order slip, two lines.
      { id: "O-3001", date: "10 Jul", shop: "Shop 1", source: "Factory", items: [{ product: "Kaju Katli", qtyKg: 20 }, { product: "Rasgulla", qtyKg: 8 }], qtyKg: 28, status: "Dispatched", note: "" },
      { id: "O-3002", date: "10 Jul", shop: "Shop 2", source: "Factory", items: [{ product: "Gulab Jamun", qtyKg: 12 }], qtyKg: 12, status: "Pending", note: "" },
      { id: "O-3003", date: "10 Jul", shop: "Shop 1", source: "Warehouse 1", items: [{ product: "Soan Papdi", qtyKg: 8 }], qtyKg: 8, status: "Accepted", note: "" },
      { id: "O-3004", date: "09 Jul", shop: "Shop 3", source: "Factory", items: [{ product: "Soan Papdi", qtyKg: 15 }], qtyKg: 15, status: "Received", note: "" },
    ],
    bills: [
      { id: "B-5001", time: "10:05", shop: "Shop 1", customer: "Walk-in", items: [{ item: "Gulab Jamun", qtyKg: 1, rate: 350, amount: 350 }], qtyKg: 1, amount: 350, pay: "Cash" },
      // A single customer buying three things — ONE bill, three line items.
      { id: "B-5002", time: "10:26", shop: "Shop 1", customer: "Rahul Mehta", items: [{ item: "Kaju Katli", qtyKg: 2, rate: 800, amount: 1600 }, { item: "Gulab Jamun", qtyKg: 1, rate: 350, amount: 350 }, { item: "Soan Papdi", qtyKg: 0.5, rate: 250, amount: 125 }], qtyKg: 3.5, amount: 2075, pay: "Online" },
      { id: "B-5003", time: "11:15", shop: "Shop 2", customer: "Anita", items: [{ item: "Soan Papdi", qtyKg: 1, rate: 250, amount: 250 }], qtyKg: 1, amount: 250, pay: "Cash" },
    ],
    raw: [
      { id: "R-9001", date: "10 Jul", material: "Khoya", neededKg: 40, availableKg: 50, source: "Warehouse", status: "Ordered", forOrder: "O-3001" },
      { id: "R-9002", date: "10 Jul", material: "Cashew", neededKg: 25, availableKg: 0, source: "Vendor", status: "Requested", forOrder: "O-3003" },
    ],
    users: [
      { id: "U-1", name: "Owner / Super Admin", role: "Owner / Super Admin", location: "All locations", status: "Active" },
      { id: "U-2", name: "General Manager", role: "General Manager", location: "All locations", status: "Active" },
      { id: "U-3", name: "Factory Admin", role: "Factory Admin", location: "Factory", status: "Active" },
      { id: "U-4", name: "Warehouse 1 Admin", role: "Warehouse Admin", location: "Warehouse 1", status: "Active" },
      { id: "U-5", name: "Warehouse 2 Admin", role: "Warehouse Admin", location: "Warehouse 2", status: "Inactive" },
      { id: "U-6", name: "Shop 1 Admin", role: "Shop Admin", location: "Shop 1", status: "Active" },
      { id: "U-7", name: "Shop 2 Admin", role: "Shop Admin", location: "Shop 2", status: "Active" },
      { id: "U-8", name: "Shop 3 Admin", role: "Shop Admin", location: "Shop 3", status: "Inactive" },
      { id: "U-9", name: "Shop 1 Admin 2", role: "Shop Admin", location: "Shop 1", status: "Active" },
    ],
    products: PRODUCTS.map((p, i) => ({ id: `P-${i + 1}`, name: p.name, rate: p.rate, expiryDays: p.expiryDays })),
    vendors: [
      { id: "V-1", name: "Sonali Dairy", category: "Milk & Khoya", contact: "98xxxxxx11" },
      { id: "V-2", name: "Metro Wholesale", category: "Grocery", contact: "98xxxxxx22" },
      { id: "V-3", name: "HP Gas", category: "Fuel / Gas", contact: "1800-xxxxxx" },
      { id: "V-4", name: "Kolkata Dry Fruits", category: "Dry fruits", contact: "90xxxxxx33" },
    ],
    transfers: [
      { id: "T-701", date: "10 Jul", product: "Kaju Katli", batch: "LOT-1001", qtyKg: 20, from: "Factory", to: "Warehouse 1", dispatchedBy: "Factory Admin", receivedBy: "—", status: "Dispatched" },
      { id: "T-702", date: "10 Jul", product: "Gulab Jamun", batch: "LOT-1005", qtyKg: 7, from: "Warehouse 1", to: "Shop 1", dispatchedBy: "WH1 Admin", receivedBy: "Ramesh", status: "Received" },
      { id: "T-703", date: "09 Jul", product: "Rasgulla", batch: "LOT-1007", qtyKg: 15, from: "Factory", to: "Warehouse 2", dispatchedBy: "Factory Admin", receivedBy: "WH2 Admin", status: "Received" },
    ],
    milk: [
      { id: "MK-201", date: "1 Apr 25", vendor: "Sonali Dairy", qtyL: 100, rate: 70, amount: 7000, payment: "Paid", location: "Factory", receivedBy: "Owner" },
      { id: "MK-202", date: "2 Apr 25", vendor: "Sonali Dairy", qtyL: 90, rate: 70, amount: 6300, payment: "Pending", location: "Factory", receivedBy: "Owner" },
    ],
    gas: [
      { id: "GS-101", date: "2 Apr 25", vendor: "HP Gas", qtyKg: 18, rate: 100, amount: 1800, payment: "Paid", location: "Factory", receivedBy: "Shravan" },
      { id: "GS-102", date: "4 Apr 25", vendor: "HP Gas", qtyKg: 18, rate: 100, amount: 1800, payment: "Pending", location: "Factory", receivedBy: "Shravan" },
    ],
    inventory: [
      { id: "I-1", product: "Kaju Katli", location: "Factory", batch: "LOT-1001", mfgDate: "8 Jul 25", expiry: "28 Jul 25", opening: 30, inQty: 20, outQty: 25, closing: 25, status: "In stock" },
      { id: "I-2", product: "Gulab Jamun", location: "Warehouse 1", batch: "LOT-1005", mfgDate: "9 Jul 25", expiry: "14 Jul 25", opening: 18, inQty: 7, outQty: 22, closing: 3, status: "Low" },
      { id: "I-3", product: "Rasgulla", location: "Warehouse 2", batch: "LOT-1007", mfgDate: "9 Jul 25", expiry: "13 Jul 25", opening: 22, inQty: 15, outQty: 30, closing: 7, status: "In stock" },
      { id: "I-4", product: "Soan Papdi", location: "Shop 1", batch: "LOT-0990", mfgDate: "20 Jun 25", expiry: "20 Jul 25", opening: 40, inQty: 0, outQty: 40, closing: 0, status: "Out of stock" },
      { id: "I-5", product: "Milk Cake", location: "Shop 3", batch: "LOT-1010", mfgDate: "9 Jul 25", expiry: "16 Jul 25", opening: 5, inQty: 5, outQty: 4, closing: 6, status: "In stock" },
    ],
    expenses: [
      { id: "E-1", slNo: "P.00001", month: "Apr 25", date: "1 Apr 25", amount: 700, item: "Buffalo Milk", qty: "10", unit: "Litre", vendor: "Sonali Dairy", paymentStatus: "Paid", paymentDetails: "Owner (ICICI *7295) on 1 Apr to vendor", category: "Ingredients", subCategory: "Milk", location: "Factory", receivedBy: "Owner", checkedBy: "Owner", bill: "Yes", comments: "" },
      { id: "E-2", slNo: "P.00002", month: "Apr 25", date: "1 Apr 25", amount: 30, item: "Tomato", qty: "1", unit: "Kg", vendor: "NA", paymentStatus: "Paid", paymentDetails: "Cash on 1 Apr", category: "Ingredients", subCategory: "Vegetables", location: "Factory", receivedBy: "Owner", checkedBy: "Owner", bill: "No", comments: "" },
      { id: "E-3", slNo: "P.00003", month: "Apr 25", date: "2 Apr 25", amount: 12500, item: "24×18 inch chamber", qty: "1", unit: "Pc", vendor: "Steel Works", paymentStatus: "Pending", paymentDetails: "Advance ₹5,000 paid", category: "One time Setup", subCategory: "Construction", location: "Factory", receivedBy: "Nahar Singh", checkedBy: "Owner", bill: "Yes", comments: "Balance on delivery" },
      { id: "E-4", slNo: "P.00004", month: "Apr 25", date: "2 Apr 25", amount: 1800, item: "CNG refill", qty: "18", unit: "Kg", vendor: "HP Gas", paymentStatus: "Paid", paymentDetails: "FASTag", category: "Fuel", subCategory: "Cng", location: "MH12UM3803", receivedBy: "Shravan", checkedBy: "Owner", bill: "Yes", comments: "" },
      { id: "E-5", slNo: "P.00005", month: "Apr 25", date: "3 Apr 25", amount: 420, item: "Sugar 25 kg bag", qty: "1", unit: "Bag", vendor: "Metro Wholesale", paymentStatus: "Paid", paymentDetails: "UPI on 3 Apr", category: "Ingredients", subCategory: "Grocery", location: "Factory", receivedBy: "Akhilesh Yadav", checkedBy: "Owner", bill: "Yes", comments: "" },
      { id: "E-6", slNo: "P.00006", month: "Apr 25", date: "4 Apr 25", amount: 340, item: "Floor cleaner + phenyl", qty: "2", unit: "Pc", vendor: "DMart", paymentStatus: "Paid", paymentDetails: "Card", category: "Staff Welfare", subCategory: "Cleaning & Hygiene", location: "Factory", receivedBy: "Akhilesh Yadav", checkedBy: "Owner", bill: "Yes", comments: "" },
    ],
    employees: [
      { id: "EMP-a", code: "EMP-001", name: "Ramesh", assignment: "Shop 1", salary: 12000, advance: 2000, club: "Counter Team", status: "Pending" },
      { id: "EMP-b", code: "EMP-002", name: "Suresh", assignment: "Shop 1", salary: 11000, advance: 0, club: "Counter Team", status: "Pending" },
      { id: "EMP-c", code: "EMP-003", name: "Nahar Singh", assignment: "Factory", salary: 15000, advance: 3000, club: "Kitchen Team", status: "Paid" },
      { id: "EMP-d", code: "EMP-004", name: "Shravan", assignment: "Factory", salary: 14000, advance: 0, club: "Kitchen Team", status: "Pending" },
      { id: "EMP-e", code: "EMP-005", name: "Akhilesh Yadav", assignment: "Factory", salary: 13000, advance: 0, club: "Kitchen Team", status: "Pending" },
      { id: "EMP-f", code: "EMP-006", name: "Priya", assignment: "Shop 2", salary: 12000, advance: 1000, club: "None", status: "Pending" },
      { id: "EMP-g", code: "EMP-007", name: "Vikram", assignment: "Warehouse 1", salary: 13000, advance: 0, club: "None", status: "Paid" },
    ],
    locations: [...STOCK_LOCATIONS],
  };
}

const ID_PREFIX: Record<Kind, string> = {
  orders: "O",
  bills: "B",
  raw: "R",
  users: "U",
  products: "P",
  vendors: "V",
  transfers: "T",
  milk: "MK",
  gas: "GS",
  inventory: "I",
  expenses: "E",
  employees: "EMP",
};

/* ------------------------------- Context ---------------------------------- */

type StoreApi = {
  db: DB;
  placeOrder: (shop: string, source: string, items: OrderItem[]) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  requestRawForOrder: (order: FactoryOrder) => void;
  addBill: (shop: string, customer: string, items: BillItem[], pay: PayMode) => void;
  addRawReq: (material: string, neededKg: number, availableKg: number) => void;
  setRaw: (id: string, patch: Partial<RawReq>) => void;
  addUser: (name: string, role: string, location: string) => void;
  addProduct: (name: string, rate: number, expiryDays: number) => void;
  addVendor: (name: string, category: string, contact: string) => void;
  addExpense: () => void;
  addEmployeeRow: () => void;
  addLocation: (name: string) => void;
  removeLocation: (name: string) => void;
  addRow: (kind: Kind, row: Record<string, unknown>) => void;
  updateRow: (kind: Kind, id: string, patch: Record<string, unknown>) => void;
  deleteRow: (kind: Kind, id: string) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seed);
  const seqRef = useRef(1);
  const nextId = useCallback((prefix: string) => `${prefix}-${9000 + seqRef.current++}`, []);

  const placeOrder = useCallback(
    (shop: string, source: string, items: OrderItem[]) => {
      if (items.length === 0) return;
      const qtyKg = items.reduce((a, l) => a + (Number(l.qtyKg) || 0), 0);
      setDb((p) => ({
        ...p,
        orders: [
          { id: nextId("O"), date: "10 Jul", shop, source, items, qtyKg, status: "Pending", note: "" },
          ...p.orders,
        ],
      }));
    },
    [nextId],
  );

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setDb((p) => ({
      ...p,
      orders: p.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  }, []);

  const requestRawForOrder = useCallback(
    (order: FactoryOrder) => {
      setDb((p) => ({
        ...p,
        orders: p.orders.map((o) => (o.id === order.id ? { ...o, note: "Raw material requested" } : o)),
        raw: [
          // One raw-material request per product line on the order.
          ...order.items.map((it): RawReq => ({
            id: nextId("R"),
            date: "10 Jul",
            material: `${it.product} mix`,
            neededKg: it.qtyKg,
            availableKg: 0,
            source: "—",
            status: "Requested",
            forOrder: order.id,
          })),
          ...p.raw,
        ],
      }));
    },
    [nextId],
  );

  const addBill = useCallback(
    (shop: string, customer: string, items: BillItem[], pay: PayMode) => {
      if (items.length === 0) return;
      const amount = items.reduce((a, l) => a + (Number(l.amount) || 0), 0);
      const qtyKg = items.reduce((a, l) => a + (Number(l.qtyKg) || 0), 0);
      setDb((p) => ({
        ...p,
        bills: [
          { id: nextId("B"), time: "now", shop, customer: customer || "Walk-in", items, qtyKg, amount, pay },
          ...p.bills,
        ],
      }));
    },
    [nextId],
  );

  const addRawReq = useCallback(
    (material: string, neededKg: number, availableKg: number) => {
      setDb((p) => ({
        ...p,
        raw: [
          { id: nextId("R"), date: "10 Jul", material, neededKg, availableKg, source: "—", status: "Requested", forOrder: "" },
          ...p.raw,
        ],
      }));
    },
    [nextId],
  );

  const setRaw = useCallback((id: string, patch: Partial<RawReq>) => {
    setDb((p) => ({ ...p, raw: p.raw.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);

  const addUser = useCallback(
    (name: string, role: string, location: string) => {
      setDb((p) => ({
        ...p,
        users: [
          ...p.users,
          { id: nextId("U"), name: name || "New User", role, location, status: "Active" },
        ],
      }));
    },
    [nextId],
  );

  const addProduct = useCallback(
    (name: string, rate: number, expiryDays: number) => {
      setDb((p) => ({
        ...p,
        products: [...p.products, { id: nextId("P"), name: name || "New Product", rate, expiryDays }],
      }));
    },
    [nextId],
  );

  const addVendor = useCallback(
    (name: string, category: string, contact: string) => {
      setDb((p) => ({
        ...p,
        vendors: [...p.vendors, { id: nextId("V"), name: name || "New Vendor", category, contact }],
      }));
    },
    [nextId],
  );

  // One-click "add row" for the Expenses ledger: auto serial (P.00001), auto
  // month from today's date, sensible defaults — then the row is edited inline.
  const addExpense = useCallback(() => {
    setDb((p) => {
      const maxNo = p.expenses.reduce((m, e) => {
        const n = parseInt((e.slNo || "P.0").split(".")[1]) || 0;
        return Math.max(m, n);
      }, 0);
      const slNo = "P." + String(maxNo + 1).padStart(5, "0");
      const now = new Date();
      const row: Expense = {
        id: nextId("E"),
        slNo,
        month: fmtMonth(now),
        date: fmtDay(now),
        amount: 0,
        item: "",
        qty: "",
        unit: "Kg",
        vendor: "NA",
        paymentStatus: "Pending",
        paymentDetails: "",
        category: "Ingredients",
        subCategory: "",
        location: "Factory",
        receivedBy: "",
        checkedBy: "",
        bill: "No",
        comments: "",
      };
      return { ...p, expenses: [row, ...p.expenses] };
    });
  }, [nextId]);

  // One-click add for the Payroll sheet: auto EMP code, then edit inline.
  const addEmployeeRow = useCallback(() => {
    setDb((p) => {
      const maxNo = p.employees.reduce((m, e) => {
        const n = parseInt((e.code || "EMP-0").split("-")[1]) || 0;
        return Math.max(m, n);
      }, 0);
      const code = "EMP-" + String(maxNo + 1).padStart(3, "0");
      const row: Employee = {
        id: nextId("EMP"),
        code,
        name: "",
        assignment: "Factory",
        salary: 0,
        advance: 0,
        club: "None",
        status: "Pending",
      };
      return { ...p, employees: [row, ...p.employees] };
    });
  }, [nextId]);

  // Super Admin can grow the location list at any time (new shop, warehouse…).
  const addLocation = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setDb((p) =>
      p.locations.some((l) => l.toLowerCase() === n.toLowerCase())
        ? p
        : { ...p, locations: [...p.locations, n] },
    );
  }, []);

  const removeLocation = useCallback((name: string) => {
    setDb((p) => ({ ...p, locations: p.locations.filter((l) => l !== name) }));
  }, []);

  // Generic add — prepends a new row to any ledger with an auto id.
  const addRow = useCallback(
    (kind: Kind, row: Record<string, unknown>) => {
      setDb((p) => ({
        ...p,
        [kind]: [{ id: nextId(ID_PREFIX[kind]), ...row }, ...(p[kind] as { id: string }[])],
      }));
    },
    [nextId],
  );

  const updateRow = useCallback((kind: Kind, id: string, patch: Record<string, unknown>) => {
    setDb((p) => ({
      ...p,
      [kind]: (p[kind] as { id: string }[]).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteRow = useCallback((kind: Kind, id: string) => {
    setDb((p) => ({ ...p, [kind]: (p[kind] as { id: string }[]).filter((r) => r.id !== id) }));
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      db,
      placeOrder,
      setOrderStatus,
      requestRawForOrder,
      addBill,
      addRawReq,
      setRaw,
      addUser,
      addProduct,
      addVendor,
      addExpense,
      addEmployeeRow,
      addLocation,
      removeLocation,
      addRow,
      updateRow,
      deleteRow,
    }),
    [db, placeOrder, setOrderStatus, requestRawForOrder, addBill, addRawReq, setRaw, addUser, addProduct, addVendor, addExpense, addEmployeeRow, addLocation, removeLocation, addRow, updateRow, deleteRow],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
