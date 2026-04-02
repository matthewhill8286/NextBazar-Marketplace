// ─── Helpers ────────────────────────────────────────────────────────────────

import type {ListingCardRow} from "@/lib/supabase/supabase.types";

export function getAttr(listing: ListingCardRow, key: string): string {
    const attrs = (listing as Record<string, unknown>).attributes;
    if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
        return ((attrs as Record<string, unknown>)[key] as string) ?? "";
    }
    return "";
}
