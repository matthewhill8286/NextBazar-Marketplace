"use client";

import {
  CheckCircle,
  CheckSquare,
  Eye,
  Heart,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  RotateCcw,
  Square,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  price_type?: string;
  condition?: string | null;
  status: string;
  primary_image_url: string | null;
  view_count: number;
  favorite_count: number;
  is_promoted: boolean;
  is_urgent: boolean;
  created_at: string;
  category_id?: string | null;
  location_id?: string | null;
  categories:
    | { name: string; slug: string; icon?: string }[]
    | { name: string; slug: string; icon?: string }
    | null;
  locations: { name: string }[] | { name: string } | null;
};

const TABS = [
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
  { key: "expired", label: "Expired" },
  { key: "draft", label: "Drafts" },
];

export default function ListingsClient({
  initialListings,
}: {
  initialListings: Listing[];
}) {
  const supabase = createClient();
  const [listings, setListings] = useState(initialListings);
  const [tab, setTab] = useState("active");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filtered = listings.filter((l) => l.status === tab);
  const selectedInTab = filtered.filter((l) => selected.has(l.id));
  const allSelected =
    filtered.length > 0 && selectedInTab.length === filtered.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => next.add(l.id));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // ── Single-item actions ──────────────────────────────────────────────────

  function unwrap<T>(val: T | T[] | null): T | null {
    if (!val) return null;
    if (Array.isArray(val)) return val[0] || null;
    return val;
  }

  function formatPrice(p: number | null, c: string) {
    if (!p) return "Contact";
    return `${c === "EUR" ? "€" : c}${p.toLocaleString()}`;
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function updateStatus(id: string, status: string) {
    setLoadingAction(id);
    await supabase.from("listings").update({ status }).eq("id", id);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );
    setOpenMenu(null);
    setLoadingAction(null);
  }

  async function deleteListing(id: string) {
    setLoadingAction(id);
    await supabase.from("listings").delete().eq("id", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    setOpenMenu(null);
    setLoadingAction(null);
  }

  async function relistListing(id: string) {
    setLoadingAction(id);
    const original = listings.find((l) => l.id === id);
    if (!original) {
      setLoadingAction(null);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoadingAction(null);
      return;
    }

    const suffix = Date.now().toString(36);
    const baseSlug = original.slug.replace(/-[a-z0-9]{6,}$/, "");
    const newSlug = `${baseSlug}-${suffix}`;

    const { data: newListing, error } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        title: original.title,
        slug: newSlug,
        description: null,
        price: original.price,
        currency: original.currency,
        price_type: original.price_type ?? "fixed",
        condition: original.condition ?? null,
        category_id: original.category_id ?? null,
        location_id: original.location_id ?? null,
        primary_image_url: original.primary_image_url,
        status: "active",
        is_promoted: false,
        is_urgent: false,
        view_count: 0,
        favorite_count: 0,
      })
      .select()
      .single();

    if (!error && newListing) {
      const { data: imgs } = await supabase
        .from("listing_images")
        .select("url, sort_order")
        .eq("listing_id", id);
      if (imgs && imgs.length > 0) {
        await supabase.from("listing_images").insert(
          imgs.map((img) => ({
            listing_id: newListing.id,
            url: img.url,
            sort_order: img.sort_order,
          })),
        );
      }
      setListings((prev) => [
        {
          ...newListing,
          categories: original.categories,
          locations: original.locations,
        },
        ...prev,
      ]);
      setTab("active");
    }

    setOpenMenu(null);
    setLoadingAction(null);
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────

  async function bulkDelete() {
    setBulkLoading(true);
    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    await supabase.from("listings").delete().in("id", ids);
    setListings((prev) => prev.filter((l) => !ids.includes(l.id)));
    clearSelection();
    setShowDeleteConfirm(false);
    setBulkLoading(false);
  }

  async function bulkMarkSold() {
    setBulkLoading(true);
    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    await supabase.from("listings").update({ status: "sold" }).in("id", ids);
    setListings((prev) =>
      prev.map((l) => (ids.includes(l.id) ? { ...l, status: "sold" } : l)),
    );
    clearSelection();
    setBulkLoading(false);
    setTab("sold");
  }

  async function bulkRelist() {
    setBulkLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBulkLoading(false);
      return;
    }

    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    const newListings: Listing[] = [];

    for (const id of ids) {
      const original = listings.find((l) => l.id === id);
      if (!original) continue;
      const suffix =
        Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const baseSlug = original.slug.replace(/-[a-z0-9]{6,}$/, "");
      const { data: nl } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: original.title,
          slug: `${baseSlug}-${suffix}`,
          price: original.price,
          currency: original.currency,
          price_type: original.price_type ?? "fixed",
          condition: original.condition ?? null,
          category_id: original.category_id ?? null,
          location_id: original.location_id ?? null,
          primary_image_url: original.primary_image_url,
          status: "active",
          is_promoted: false,
          is_urgent: false,
          view_count: 0,
          favorite_count: 0,
        })
        .select()
        .single();
      if (nl) {
        newListings.push({
          ...nl,
          categories: original.categories,
          locations: original.locations,
        });
      }
    }

    setListings((prev) => [...newListings, ...prev]);
    clearSelection();
    setBulkLoading(false);
    setTab("active");
  }

  const SelectIcon = allSelected ? CheckSquare : Square;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((t) => {
          const count = listings.filter((l) => l.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                clearSelection();
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedInTab.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-sm font-medium text-blue-800">
            {selectedInTab.length} selected
          </span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {tab === "expired" && (
              <button
                onClick={bulkRelist}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Relist All
              </button>
            )}
            {tab === "active" && (
              <button
                onClick={bulkMarkSold}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                Mark Sold
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Listings */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {/* Select-all header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              <SelectIcon className="w-4 h-4" />
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {filtered.map((listing) => {
            const isSelected = selected.has(listing.id);
            return (
              <div
                key={listing.id}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(listing.id)}
                  className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  {listing.primary_image_url ? (
                    <Image
                      src={listing.primary_image_url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center ${getCategoryConfig(unwrap(listing.categories)?.slug).bg}`}
                    >
                      <CategoryIcon
                        slug={unwrap(listing.categories)?.slug}
                        size={20}
                      />
                    </div>
                  )}
                  {listing.is_promoted && listing.status !== "sold" && (
                    <span className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                      AD
                    </span>
                  )}
                  {listing.status === "sold" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-900 text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                        Sold
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="font-medium text-gray-900 text-sm hover:text-blue-600 truncate block"
                  >
                    {listing.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(listing.price, listing.currency)}
                    </span>
                    <span>·</span>
                    <span>{unwrap(listing.locations)?.name || "Cyprus"}</span>
                    <span>·</span>
                    <span>{timeAgo(listing.created_at)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-5 text-xs text-gray-500 shrink-0">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(listing.view_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{listing.favorite_count || 0}</span>
                  </div>
                </div>

                {/* Relist CTA */}
                {listing.status === "expired" && (
                  <button
                    onClick={() => relistListing(listing.id)}
                    disabled={loadingAction === listing.id}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {loadingAction === listing.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Relist
                  </button>
                )}

                {/* Actions Menu */}
                <div className="relative shrink-0">
                  {loadingAction === listing.id ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : (
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === listing.id ? null : listing.id)
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}

                  {openMenu === listing.id && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-20">
                      <Link
                        href={`/dashboard/edit/${listing.id}`}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setOpenMenu(null)}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Listing
                      </Link>
                      {listing.status === "active" && !listing.is_promoted && (
                        <Link
                          href={`/promote/${listing.id}`}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Star className="w-3.5 h-3.5" /> Promote Listing
                        </Link>
                      )}
                      {listing.status === "active" && (
                        <button
                          onClick={() => updateStatus(listing.id, "sold")}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark as Sold
                        </button>
                      )}
                      {listing.status === "sold" && (
                        <button
                          onClick={() => updateStatus(listing.id, "active")}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      )}
                      {listing.status === "expired" && (
                        <button
                          onClick={() => relistListing(listing.id)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Relist
                        </button>
                      )}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>

                      {/* Promote listing placeholder */}
                      {listing.status !== "active" && (
                        <Link
                          href={`/promote/${listing.id}`}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Tag className="w-3.5 h-3.5" /> Promote
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">
            {tab === "active" ? "📦" : tab === "sold" ? "✅" : "⏳"}
          </div>
          <p className="text-gray-500 text-sm">No {tab} listings</p>
        </div>
      )}

      {/* Bulk delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete {selectedInTab.length} listing
              {selectedInTab.length !== 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
