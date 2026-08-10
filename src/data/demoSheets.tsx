import type { ColDef, ICellRendererParams } from "ag-grid-community";

/* Status chip cell renderer factory — maps a value to a themed chip. */
function chip(map: Record<string, string>) {
  return (p: ICellRendererParams) => {
    const v = (p.value ?? "") as string;
    if (!v) return null;
    const cls = map[v] ?? "neutral";
    return (
      <span className={`chip ${cls}`}>
        <span className="dot" />
        {v}
      </span>
    );
  };
}

const money = (p: { value: unknown }) =>
  p.value == null || p.value === ""
    ? ""
    : "₹" + Number(p.value).toLocaleString("en-IN");
const rightNum = { cellStyle: { textAlign: "right" as const } };

/* ============================= EXPENSES ============================= */
/* Columns mirror the client's real "Expenses" tab. */
export type ExpenseRow = {
  slNo: string;
  month: string;
  date: string;
  amount: number;
  description: string;
  qty: string;
  unit: string;
  vendor: string;
  paymentStatus: string;
  paymentDetails: string;
  category: string;
  subCategory: string;
  location: string;
  receivedBy: string;
  checkedBy: string;
  bill: string;
  comments: string;
};

export const expenseColumns: ColDef<ExpenseRow>[] = [
  { field: "slNo", headerName: "Sl. No.", pinned: "left", width: 96, editable: false },
  { field: "month", headerName: "Month", width: 90 },
  { field: "date", headerName: "Date of Expense", width: 130 },
  { field: "amount", headerName: "Amount", width: 110, valueFormatter: money, ...rightNum },
  { field: "description", headerName: "Product / Service", minWidth: 190 },
  { field: "qty", headerName: "Qty", width: 80, ...rightNum },
  { field: "unit", headerName: "Unit", width: 90 },
  { field: "vendor", headerName: "Purchased from", minWidth: 150 },
  {
    field: "paymentStatus",
    headerName: "Payment",
    width: 130,
    cellRenderer: chip({ Paid: "ok", Pending: "warn" }),
  },
  { field: "paymentDetails", headerName: "Payment Details", minWidth: 240 },
  { field: "category", headerName: "Category", minWidth: 140 },
  { field: "subCategory", headerName: "Sub-Category", minWidth: 150 },
  { field: "location", headerName: "Received at", minWidth: 150 },
  { field: "receivedBy", headerName: "Received by", minWidth: 130 },
  { field: "checkedBy", headerName: "Checked by", minWidth: 130 },
  { field: "bill", headerName: "Bill?", width: 100 },
  { field: "comments", headerName: "Comments", minWidth: 140 },
];

export const expenseRows: ExpenseRow[] = [
  { slNo: "P.00001", month: "Apr 25", date: "1 Apr 25", amount: 700, description: "Buffalo Milk", qty: "10", unit: "Litre", vendor: "Sonali Dairy", paymentStatus: "Paid", paymentDetails: "Debasish (ICICI *7295) on 1 Apr to vendor", category: "Ingredients", subCategory: "Milk", location: "Factory", receivedBy: "Debasish", checkedBy: "Debasish", bill: "Yes", comments: "" },
  { slNo: "P.00002", month: "Apr 25", date: "1 Apr 25", amount: 30, description: "Tomato", qty: "1", unit: "Kg", vendor: "NA", paymentStatus: "Paid", paymentDetails: "Cash on 1 Apr", category: "Ingredients", subCategory: "Vegetables", location: "Factory", receivedBy: "Debasish", checkedBy: "Debasish", bill: "P.00001", comments: "" },
  { slNo: "P.00003", month: "Apr 25", date: "2 Apr 25", amount: 12500, description: "24×18 inch chamber", qty: "1", unit: "Pc", vendor: "Steel Works", paymentStatus: "Pending", paymentDetails: "Advance ₹5,000 paid", category: "One time Setup", subCategory: "Construction", location: "Factory", receivedBy: "Nahar Singh", checkedBy: "Debasish", bill: "Yes", comments: "Balance on delivery" },
  { slNo: "P.00004", month: "Apr 25", date: "2 Apr 25", amount: 1800, description: "CNG refill", qty: "18", unit: "Kg", vendor: "HP Gas", paymentStatus: "Paid", paymentDetails: "FASTag", category: "Fuel", subCategory: "Cng", location: "MH12UM3803", receivedBy: "Shravan", checkedBy: "Debasish", bill: "Yes", comments: "" },
  { slNo: "P.00005", month: "Apr 25", date: "3 Apr 25", amount: 420, description: "Sugar 25 kg bag", qty: "1", unit: "Bag", vendor: "Metro Wholesale", paymentStatus: "Paid", paymentDetails: "UPI on 3 Apr", category: "Ingredients", subCategory: "Grocery", location: "Factory", receivedBy: "Akhilesh Yadav", checkedBy: "Debasish", bill: "Yes", comments: "" },
  { slNo: "P.00006", month: "Apr 25", date: "3 Apr 25", amount: 260, description: "Bananas", qty: "6", unit: "Dozen", vendor: "Local Mandi", paymentStatus: "Paid", paymentDetails: "Cash", category: "Ingredients", subCategory: "Fruits", location: "Viman Nagar Shop", receivedBy: "Shravan", checkedBy: "Debasish", bill: "No", comments: "" },
  { slNo: "P.00007", month: "Apr 25", date: "4 Apr 25", amount: 340, description: "Floor cleaner + phenyl", qty: "2", unit: "Pc", vendor: "DMart", paymentStatus: "Paid", paymentDetails: "Card", category: "Staff Welfare", subCategory: "Cleaning & Hygiene", location: "Factory", receivedBy: "Akhilesh Yadav", checkedBy: "Debasish", bill: "Yes", comments: "" },
  { slNo: "P.00008", month: "Apr 25", date: "4 Apr 25", amount: 900, description: "Petrol (delivery bike)", qty: "8", unit: "Litre", vendor: "IOCL", paymentStatus: "Pending", paymentDetails: "To reimburse", category: "Fuel", subCategory: "Petrol", location: "MH14GH1121", receivedBy: "Shravan", checkedBy: "Debasish", bill: "No", comments: "Reimbursement" },
];

/* ========================= PRODUCT INVENTORY ======================== */
/* Placeholder columns until the client shares the real tab. Stock is in kg. */
export type InventoryRow = {
  product: string;
  location: string;
  opening: number;
  inQty: number;
  outQty: number;
  closing: number;
  status: string;
};

export const inventoryColumns: ColDef<InventoryRow>[] = [
  { field: "product", headerName: "Product", pinned: "left", minWidth: 170 },
  { field: "location", headerName: "Location", minWidth: 150 },
  { field: "opening", headerName: "Opening (kg)", width: 130, ...rightNum },
  { field: "inQty", headerName: "In (kg)", width: 110, ...rightNum },
  { field: "outQty", headerName: "Out (kg)", width: 110, ...rightNum },
  { field: "closing", headerName: "Closing (kg)", width: 130, ...rightNum },
  {
    field: "status",
    headerName: "Status",
    width: 140,
    cellRenderer: chip({ "In stock": "ok", Low: "warn", "Out of stock": "danger" }),
  },
];

export const inventoryRows: InventoryRow[] = [
  { product: "Kaju Katli", location: "Factory", opening: 30, inQty: 20, outQty: 25, closing: 25, status: "In stock" },
  { product: "Gulab Jamun", location: "Warehouse 1", opening: 18, inQty: 7, outQty: 22, closing: 3, status: "Low" },
  { product: "Rasgulla", location: "Warehouse 2", opening: 22, inQty: 15, outQty: 30, closing: 7, status: "In stock" },
  { product: "Soan Papdi", location: "Shop 1", opening: 40, inQty: 0, outQty: 40, closing: 0, status: "Out of stock" },
  { product: "Milk Cake", location: "Shop 3", opening: 5, inQty: 5, outQty: 4, closing: 6, status: "In stock" },
];

/* ========================= PRODUCT TRANSFER ========================= */
export type TransferRow = {
  slNo: string;
  date: string;
  product: string;
  qty: number;
  from: string;
  to: string;
  status: string;
  receivedBy: string;
};

export const transferColumns: ColDef<TransferRow>[] = [
  { field: "slNo", headerName: "Sl. No.", pinned: "left", width: 100 },
  { field: "date", headerName: "Date", width: 120 },
  { field: "product", headerName: "Product", minWidth: 160 },
  { field: "qty", headerName: "Qty (kg)", width: 110, ...rightNum },
  { field: "from", headerName: "From", minWidth: 140 },
  { field: "to", headerName: "To", minWidth: 140 },
  {
    field: "status",
    headerName: "Status",
    width: 150,
    cellRenderer: chip({ Received: "ok", Dispatched: "info", Accepted: "info", Sent: "warn", "Not received": "danger" }),
  },
  { field: "receivedBy", headerName: "Received by", minWidth: 140 },
];

export const transferRows: TransferRow[] = [
  { slNo: "SH-701", date: "10 Jul", product: "Kaju Katli", qty: 20, from: "Factory", to: "Warehouse 1", status: "Dispatched", receivedBy: "—" },
  { slNo: "SH-702", date: "10 Jul", product: "Gulab Jamun", qty: 7, from: "Warehouse 1", to: "Shop 1", status: "Received", receivedBy: "Ramesh" },
  { slNo: "SH-703", date: "09 Jul", product: "Rasgulla", qty: 15, from: "Factory", to: "Warehouse 2", status: "Received", receivedBy: "WH2 Admin" },
  { slNo: "SH-712", date: "10 Jul", product: "Soan Papdi", qty: 10, from: "Warehouse 1", to: "Shop 2", status: "Sent", receivedBy: "—" },
];
