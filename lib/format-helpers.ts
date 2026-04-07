/**
 * Shared formatting helpers used across listing-card, listing-detail,
 * listings-client and any other component that displays listing data.
 *
 * ⚠️  These are plain (non-i18n) versions. Components that use next-intl
 *     should wrap or override `formatPrice` / `timeAgo` with translated strings.
 */

// ─── Condition ────────────────────────────────────────────────────────────────

export const CONDITION_KEYS: Record<string, string> = {
  new: "condition_new",
  like_new: "condition_like_new",
  good: "condition_good",
  fair: "condition_fair",
  for_parts: "condition_for_parts",
};

export const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  for_parts: "For Parts",
};

/** Human-readable condition label (no i18n). */
export function conditionLabel(condition: string | null): string {
  if (!condition) return "—";
  return (
    CONDITION_LABELS[condition] ??
    condition.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
  );
}

// ─── Price input formatting ──────────────────────────────────────────────────

/**
 * Format a numeric string for display in a price input.
 * Adds thousand separators and preserves a trailing decimal/decimals.
 *   "120000"   → "120,000"
 *   "120000.5" → "120,000.5"
 *   "120000."  → "120,000."
 *   ""         → ""
 */
export function formatPriceInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);
  // Allow only digits and a single dot
  const cleaned = str.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [intPart, ...rest] = cleaned.split(".");
  const decimal = rest.length > 0 ? `.${rest.join("").slice(0, 2)}` : "";
  const intFormatted = intPart
    ? Number(intPart).toLocaleString("en-US")
    : "";
  // Preserve a trailing dot the user just typed
  if (cleaned.endsWith(".") && !decimal.includes(".")) {
    return `${intFormatted}.`;
  }
  return `${intFormatted}${decimal}`;
}

/**
 * Strip formatting from a displayed price input back to a plain numeric string.
 *   "120,000"    → "120000"
 *   "120,000.50" → "120000.50"
 */
export function parsePriceInput(value: string): string {
  if (!value) return "";
  return value.replace(/[^\d.]/g, "");
}

// ─── Price ────────────────────────────────────────────────────────────────────

/** Format a listing price. Returns "Contact" for null prices (no i18n). */
export function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Contact";
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${price.toLocaleString()}`;
}

// ─── Time ─────────────────────────────────────────────────────────────────────

/** Relative time string (no i18n). Falls back to a short date for old items. */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Compact relative time — no "ago" suffix, null-safe.
 * Designed for tight UI contexts like inbox/message timestamps.
 * e.g. "now", "3m", "2h", "4d"
 */
export function timeAgoCompact(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Array helpers ────────────────────────────────────────────────────────────

/**
 * Supabase sometimes returns a relation as an array (when using `.select(…)`)
 * and sometimes as a single object (when the FK is singular). This helper
 * normalises both forms.
 */
export function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

// ─── Expiry badge ─────────────────────────────────────────────────────────────

export type ExpiryBadge = { label: string; critical: boolean } | null;

/**
 * Returns a short expiry warning when an active listing is within 7 days of
 * expiring, or null when no warning is needed.
 */
export function expiryBadge(
  expiresAt: string | null,
  status: string,
): ExpiryBadge {
  if (status !== "active" || !expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 0 || days > 7) return null;
  return {
    label: days === 1 ? "Expires today" : `Expires in ${days}d`,
    critical: days <= 3,
  };
}
