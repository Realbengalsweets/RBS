import { themeQuartz } from "ag-grid-community";

/**
 * RBS grid theme — a single spreadsheet-style theme reused by every DataGrid
 * across all roles. Uses AG Grid v36 Theming API (no CSS imports needed).
 * Values mirror the tokens in globals.css so the grid matches the app chrome.
 */
export const rbsGridTheme = themeQuartz.withParams({
  accentColor: "#a9631a", // brand-600
  backgroundColor: "#ffffff",
  foregroundColor: "#1e293b", // ink-800
  headerBackgroundColor: "#eef1f5", // slightly deeper than the body for contrast
  headerTextColor: "#334155", // ink-700
  borderColor: "#e5e9ef", // line
  oddRowBackgroundColor: "#f7f9fc", // visible zebra striping
  rowHoverColor: "#fdf6ec", // brand-50
  selectedRowBackgroundColor: "#f9e7cf", // brand-100
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 15,
  headerFontWeight: 700,
  headerHeight: 48,
  rowHeight: 48,
  cellHorizontalPadding: 16,
  wrapperBorderRadius: 0, // the surrounding card supplies the rounded corners
  borderRadius: 5,
  // Excel-style gridlines (vertical + horizontal cell borders)
  columnBorder: true,
  rowBorder: true,
  headerColumnBorder: true,
});
