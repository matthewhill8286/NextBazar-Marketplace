import { describe, expect, it } from "vitest";
import { CARD_SELECT } from "@/lib/supabase/selects";

describe("CARD_SELECT", () => {
  it("is a non-empty string", () => {
    expect(typeof CARD_SELECT).toBe("string");
    expect(CARD_SELECT.trim().length).toBeGreaterThan(0);
  });

  it("includes essential listing columns", () => {
    const cols = [
      "id",
      "user_id",
      "category_id",
      "location_id",
      "title",
      "slug",
      "price",
      "currency",
      "price_type",
      "condition",
      "status",
      "primary_image_url",
      "is_promoted",
      "is_urgent",
      "promoted_until",
      "view_count",
      "favorite_count",
      "created_at",
    ];
    for (const col of cols) {
      expect(CARD_SELECT).toContain(col);
    }
  });

  it("includes category join", () => {
    expect(CARD_SELECT).toContain("categories(name, slug, icon)");
  });

  it("includes location join", () => {
    expect(CARD_SELECT).toContain("locations(name, slug)");
  });

  it("includes profile join with explicit FK hint", () => {
    expect(CARD_SELECT).toContain("profiles!listings_user_id_fkey");
    expect(CARD_SELECT).toContain("display_name");
    expect(CARD_SELECT).toContain("avatar_url");
    expect(CARD_SELECT).toContain("is_pro_seller");
  });

  it("does NOT include heavy columns (embedding, search_vector)", () => {
    expect(CARD_SELECT).not.toContain("embedding");
    expect(CARD_SELECT).not.toContain("search_vector");
  });

  it("does NOT include boosted_until (removed to prevent query failures before migration)", () => {
    expect(CARD_SELECT).not.toContain("boosted_until");
  });
});
