/**
 * Kleidi domain types. One paid deal = one property file.
 * Screens: /  /start  /deal/:id  /deal/:id/vault  /pay/:id
 */

export type Locale = "en" | "el" | "ru";
export type Country = "CY" | "GR";
export type DealStatus = "draft" | "paid" | "active" | "blocked" | "closed";
export type DeedStatus = "unknown" | "issued" | "pending" | "trapped";
export type MemberRole = "buyer" | "lawyer" | "surveyor" | "agent";
export type ItemStatus = "todo" | "in_review" | "done" | "blocked" | "na";

export type Bilingual = {
  en: string;
  el: string;
};

export type Profile = {
  id: string;
  fullName: string | null;
  locale: Locale;
  phone: string | null;
};

export type Deal = {
  id: string;
  status: DealStatus;
  deedStatus: DeedStatus;
  country: Country;
  city: string;
  locality: string | null;
  addressLine: string | null;
  plotOrRegNo: string | null;
  propertyType: "apartment" | "house" | "plot" | "off_plan" | null;
  askingPriceEur: number | null;
  developerName: string | null;
};

export type ChecklistItem = {
  id: string;
  dealId: string;
  key: string;
  sortOrder: number;
  label: Bilingual;
  help: Bilingual;
  status: ItemStatus;
  evidenceDocumentId: string | null;
};

export type DealDocument = {
  id: string;
  dealId: string;
  checklistKey: string | null;
  title: string;
  storagePath: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
};

export type DealPayment = {
  dealId: string;
  amountEurCents: number;
  status: "requires_payment" | "paid" | "refunded" | "failed";
  stripeCheckoutSessionId: string | null;
};

/** Stripe product: unlock one deal workspace. Price lives in Stripe, not the DB. */
export const KLEIDI_DEAL_FEE_EUR_CENTS = 49_000;

export const ROUTES = {
  home: "/",
  start: "/start",
  pay: (dealId: string) => `/pay/${dealId}`,
  deal: (dealId: string) => `/deal/${dealId}`,
  vault: (dealId: string) => `/deal/${dealId}/vault`,
} as const;

export type ScreenId = "home" | "start" | "pay" | "workspace" | "vault";
