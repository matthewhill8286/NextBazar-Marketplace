export type ListingRow = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  status: string;
  view_count: number;
  favorite_count: number;
  message_count: number;
  primary_image_url: string | null;
  created_at: string;
  updated_at?: string;
  is_promoted: boolean;
  promoted_until?: string | null;
  category_id?: string;
  location_id?: string | null;
  quantity?: number | null;
  low_stock_threshold?: number | null;
  categories?: { name: string; slug: string; icon: string | null } | null;
  locations?: { name: string } | null;
};

export type OfferRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string; // "pending" | "accepted" | "declined" | "countered" | "withdrawn" | "expired"
  counter_amount: number | null;
  counter_message: string | null;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  listing?: {
    id: string;
    title: string;
    slug: string;
    price: number | null;
    primary_image_url: string | null;
  } | null;
  buyer?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_unread: number;
  seller_unread: number;
  is_pinned: boolean;
  created_at: string;
  // Joined relations
  listing?: {
    id: string;
    title: string;
    slug: string;
    primary_image_url: string | null;
  } | null;
  buyer?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

/** Status badge colour map shared across tabs */
export const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  sold: "bg-[#f0eeeb] text-[#6b6560]",
  draft: "bg-amber-50 text-amber-700",
  paused: "bg-orange-50 text-orange-600",
  removed: "bg-red-50 text-red-600",
};

export const OFFER_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-600",
  countered: "bg-blue-50 text-blue-600",
  expired: "bg-[#f0eeeb] text-[#6b6560]",
};
