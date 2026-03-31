"use client";

import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

type Props = {
  query: string;
  categorySlug: string;
  subcategorySlug: string;
  locationSlug: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
};

export default function SaveSearchButton({
  query,
  categorySlug,
  subcategorySlug,
  locationSlug,
  priceMin,
  priceMax,
  sortBy,
}: Props) {
  const supabase = createClient();
  const { userId } = useAuth();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Check if this exact search is already saved.
  // Must use .is("field", null) for null values — .eq("field", "") does NOT
  // match NULL rows in PostgreSQL and will always return no results.
  useEffect(() => {
    if (!userId) return;
    const params = buildParams();

    let q = supabase.from("saved_searches").select("id").eq("user_id", userId);

    if (params.query) q = q.eq("query", params.query);
    else q = q.is("query", null);

    if (params.category_slug) q = q.eq("category_slug", params.category_slug);
    else q = q.is("category_slug", null);

    if (params.location_slug) q = q.eq("location_slug", params.location_slug);
    else q = q.is("location_slug", null);

    q.maybeSingle().then(({ data }) => setSavedId(data?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, query, categorySlug, locationSlug]);

  function buildParams() {
    return {
      query: query || null,
      category_slug: categorySlug || null,
      subcategory_slug: subcategorySlug || null,
      location_slug: locationSlug || null,
      price_min: priceMin ? Number(priceMin) : null,
      price_max: priceMax ? Number(priceMax) : null,
      sort_by: sortBy || "newest",
    };
  }

  function buildName() {
    const parts: string[] = [];
    if (query) parts.push(`"${query}"`);
    if (categorySlug) parts.push(categorySlug);
    if (locationSlug) parts.push(`in ${locationSlug}`);
    if (priceMax) parts.push(`under €${priceMax}`);
    return parts.length ? parts.join(" ") : "All listings";
  }

  // Not logged in — link to login
  if (!userId) return null;

  // Nothing to save
  const hasFilters =
    query || categorySlug || locationSlug || priceMin || priceMax;
  if (!hasFilters) return null;

  async function handleSave() {
    setSaving(true);
    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: userId,
        name: buildName(),
        ...buildParams(),
      })
      .select("id")
      .single();
    if (!error && data) {
      setSavedId(data.id);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleRemove() {
    if (!savedId) return;
    setSaving(true);
    await supabase.from("saved_searches").delete().eq("id", savedId);
    setSavedId(null);
    setSaving(false);
  }

  if (savedId) {
    return (
      <button
        onClick={handleRemove}
        disabled={saving}
        title="Remove saved search"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0eeeb] border border-[#e8e6e3] text-[#7A6657] text-sm font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <BellOff className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">Saved</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      title="Save this search & get alerts"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e6e3] text-[#666] text-sm font-medium hover:bg-[#f0eeeb] hover:border-[#e8e6e3] hover:text-[#7A6657] transition-colors disabled:opacity-50"
    >
      {saving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : justSaved ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Bell className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {justSaved ? "Saved!" : "Save search"}
      </span>
    </button>
  );
}
