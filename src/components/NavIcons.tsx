import type { ReactNode } from "react";

/**
 * Compact line-icon set for the sidebar navigation. One icon per tab key; a
 * neutral fallback keeps things safe if a new tab is added without an icon.
 */
const S = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <S>
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
      <rect x="3" y="17" width="8" height="4" rx="1.5" />
    </S>
  ),
  products: (
    <S>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </S>
  ),
  vendors: (
    <S>
      <path d="M3 9 4.5 4h15L21 9M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
      <path d="M9 20v-6h6v6" />
    </S>
  ),
  // Shop
  order: (
    <S>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
    </S>
  ),
  billing: (
    <S>
      <path d="M5 3h14v18l-3-1.6L13 21l-3-1.6L7 21l-2-1V3Z" />
      <path d="M9 8h6M9 12h6" />
    </S>
  ),
  // Factory / warehouse
  overview: (
    <S>
      <rect x="3" y="3" width="7" height="9" rx="1.2" />
      <rect x="14" y="3" width="7" height="5" rx="1.2" />
      <rect x="14" y="12" width="7" height="9" rx="1.2" />
      <rect x="3" y="16" width="7" height="5" rx="1.2" />
    </S>
  ),
  shopOrders: (
    <S>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </S>
  ),
  raw: (
    <S>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="M3 7l9 5 9-5M12 12v10" />
    </S>
  ),
  transfer: (
    <S>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </S>
  ),
  inventory: (
    <S>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </S>
  ),
  supplies: (
    <S>
      <path d="M3 9 12 4l9 5-9 5-9-5Z" />
      <path d="M3 9v6l9 5 9-5V9" />
    </S>
  ),
  // Super admin
  expenses: (
    <S>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.2c0-1.1 1.1-1.9 2.5-1.9s2.5.8 2.5 1.9c0 2.6-5 1.4-5 4.1 0 1.1 1.1 1.9 2.5 1.9s2.5-.8 2.5-1.9" />
    </S>
  ),
  transactions: (
    <S>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 4v16" />
    </S>
  ),
  catalog: (
    <S>
      <rect x="3" y="3" width="8" height="8" rx="1.4" />
      <rect x="13" y="3" width="8" height="8" rx="1.4" />
      <rect x="3" y="13" width="8" height="8" rx="1.4" />
      <rect x="13" y="13" width="8" height="8" rx="1.4" />
    </S>
  ),
  team: (
    <S>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M17.5 20a6.5 6.5 0 0 0-3-5.5" />
    </S>
  ),
};

const FALLBACK = (
  <S>
    <circle cx="12" cy="12" r="8" />
  </S>
);

export function NavIcon({ name }: { name: string }) {
  return <>{ICONS[name] ?? FALLBACK}</>;
}
