/**
 * useReferenceData — fetches categories, subcategories, and locations once on
 * mount, with an optional user-id for phone pre-population.
 *
 * Replaces the copy-pasted Promise.all pattern that appears in post-client.tsx,
 * edit-client.tsx, and other forms that need the full reference set.
 *
 * @example
 *   const { categories, subcategories, locations, loading } = useReferenceData();
 */

"use client";

import { useEffect, useState } from "react";
import { FEATURE_FLAGS, SOFT_LAUNCH_CATEGORY_SLUGS } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  Location,
  Subcategory,
} from "@/lib/supabase/supabase.types";

type ReferenceData = {
  categories: Category[];
  subcategories: Subcategory[];
  locations: Location[];
  loading: boolean;
};

export function useReferenceData(): ReferenceData {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    let catQuery = supabase
      .from("categories")
      .select("id, name, slug, icon")
      .order("sort_order");

    if (FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES) {
      catQuery = catQuery.in("slug", [...SOFT_LAUNCH_CATEGORY_SLUGS]);
    }

    Promise.all([
      catQuery,
      supabase
        .from("subcategories")
        .select("id, category_id, name, slug, sort_order")
        .order("sort_order"),
      supabase.from("locations").select("id, name, slug").order("sort_order"),
    ]).then(([{ data: cats }, { data: subs }, { data: locs }]) => {
      const filteredCats = (cats ?? []) as Category[];
      setCategories(filteredCats);

      // Filter subcategories to only include those from allowed categories
      if (FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES && subs) {
        const allowedIds = new Set(filteredCats.map((c) => c.id));
        setSubcategories(
          (subs as Subcategory[]).filter((s) => allowedIds.has(s.category_id)),
        );
      } else {
        if (subs) setSubcategories(subs as Subcategory[]);
      }

      if (locs) setLocations(locs as Location[]);
      setLoading(false);
    });
  }, []);

  return { categories, subcategories, locations, loading };
}
