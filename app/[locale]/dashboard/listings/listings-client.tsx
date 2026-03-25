"use client";

import {
  CheckCircle,
  CheckSquare,
  Clock,
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
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import { ConfirmDialog, EmptyState } from "@/app/components/ui";
import { LISTING_ACTIVE_MS } from "@/lib/constants";
import {
  expiryBadge,
  formatPrice,
  timeAgo,
  unwrap,
} from "@/lib/format-helpers";
import { createClient } from "@/lib/supabase/client";
import type { DashboardListing } from "@/lib/supabase/supabase.types";

/** Re-export so dashboard/page.tsx can import the canonical type. */
export type { DashboardListing as Listing };

const TABS = [
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
  { key: "expired", label: "Expired" },
  { key: "draft", label: "Drafts" },
];

export default function ListingsClient({
  initialListings,
  isProSeller = false,
  onListingsChange,
}: {
  initialListings: DashboardListing[];
  isProSeller?: boolean;
  onListingsChange?: (listings: DashboardListing[]) => void;
}) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const validTabs = ["active", "sold", "expired", "draft"];

  function tabFromParams() {
    const t = searchParams.get("tab") ?? "";
    return validTabs.includes(t) ? t : "active";
  }

  const [listings, setListingsInternal] = useState(initialListings);

  // Wrapper that notifies the parent whenever listings change
  function setListings(
    updater:
      | DashboardListing[]
      | ((prev: DashboardListing[]) => DashboardListing[]),
  ) {
    setListingsInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onListingsChange?.(next);
      return next;
    });
  }
  const [tab, setTab] = useState(tabFromParams);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Single-item confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "sold" | "renew" | "reactivate";
    listingId: string;
    listingTitle: string;
  } | null>(null);

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
        filtered.forEach((l) => {
          next.delete(l.id);
        });
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => {
          next.add(l.id);
        });
        return next;
      });
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // Keep tab in sync when the URL ?tab= param changes (sidebar stat card clicks)
  useEffect(() => {
    setTab(tabFromParams());
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("tab")]);

  // ── Single-item actions ──────────────────────────────────────────────────

  async function updateStatus(id: string, status: string) {
    setLoadingAction(id);
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update listing status.");
    } else {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l)),
      );
      toast.success(
        status === "sold" ? "Listing marked as sold" : "Listing status updated",
      );
    }
    setOpenMenu(null);
    setLoadingAction(null);
  }

  async function deleteListing(id: string) {
    setLoadingAction(id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete listing.");
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing deleted");
    }
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

  async function renewListing(id: string) {
    setLoadingAction(id);
    const newExpiresAt = new Date(Date.now() + LISTING_ACTIVE_MS).toISOString();
    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        expires_at: newExpiresAt,
        expiry_warning_sent: false,
      })
      .eq("id", id);
    if (error) {
      toast.error("Failed to renew listing.");
    } else {
      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status: "active", expires_at: newExpiresAt }
            : l,
        ),
      );
      toast.success("Listing renewed for 30 days");
      if (tab === "expired") setTab("active");
    }
    setOpenMenu(null);
    setLoadingAction(null);
  }

  // ── Confirm single-item action ────────────────────────────────────────────
  async function handleConfirmAction() {
    if (!confirmAction) return;
    const { type, listingId } = confirmAction;
    setConfirmAction(null);
    if (type === "delete") await deleteListing(listingId);
    else if (type === "sold") await updateStatus(listingId, "sold");
    else if (type === "renew") await renewListing(listingId);
    else if (type === "reactivate") await updateStatus(listingId, "active");
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────

  async function bulkDelete() {
    setBulkLoading(true);
    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    const { error } = await supabase.from("listings").delete().in("id", ids);
    if (error) {
      toast.error("Failed to delete listings.");
    } else {
      setListings((prev) => prev.filter((l) => !ids.includes(l.id)));
      toast.success(
        `${ids.length} listing${ids.length !== 1 ? "s" : ""} deleted`,
      );
    }
    clearSelection();
    setShowDeleteConfirm(false);
    setBulkLoading(false);
  }

  async function bulkMarkSold() {
    setBulkLoading(true);
    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold" })
      .in("id", ids);
    if (error) {
      toast.error("Failed to update listings.");
    } else {
      setListings((prev) =>
        prev.map((l) => (ids.includes(l.id) ? { ...l, status: "sold" } : l)),
      );
      toast.success(
        `${ids.length} listing${ids.length !== 1 ? "s" : ""} marked as sold`,
      );
      setTab("sold");
    }
    clearSelection();
    setBulkLoading(false);
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
    const newListings: DashboardListing[] = [];

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
    toast.success(
      `${newListings.length} listing${newListings.length !== 1 ? "s" : ""} relisted`,
    );
    clearSelection();
    setBulkLoading(false);
    setTab("active");
  }

  async function bulkRenew() {
    setBulkLoading(true);
    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    const newExpiresAt = new Date(Date.now() + LISTING_ACTIVE_MS).toISOString();
    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        expires_at: newExpiresAt,
        expiry_warning_sent: false,
      })
      .in("id", ids);
    if (error) {
      toast.error("Failed to renew listings.");
    } else {
      setListings((prev) =>
        prev.map((l) =>
          ids.includes(l.id)
            ? { ...l, status: "active", expires_at: newExpiresAt }
            : l,
        ),
      );
      toast.success(
        `${ids.length} listing${ids.length !== 1 ? "s" : ""} renewed`,
      );
      setTab("active");
    }
    clearSelection();
    setBulkLoading(false);
  }

  async function bulkReactivate() {
    setBulkLoading(true);
    const ids = [...selected].filter((id) => filtered.some((l) => l.id === id));
    const newExpiresAt = new Date(Date.now() + LISTING_ACTIVE_MS).toISOString();
    const { error } = await supabase
      .from("listings")
      .update({ status: "active", expires_at: newExpiresAt })
      .in("id", ids);
    if (error) {
      toast.error("Failed to reactivate listings.");
    } else {
      setListings((prev) =>
        prev.map((l) =>
          ids.includes(l.id)
            ? { ...l, status: "active", expires_at: newExpiresAt }
            : l,
        ),
      );
      toast.success(
        `${ids.length} listing${ids.length !== 1 ? "s" : ""} reactivated`,
      );
      setTab("active");
    }
    clearSelection();
    setBulkLoading(false);
  }

  const SelectIcon = allSelected ? CheckSquare : Square;

  return (
    <div className="space-y-4">
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

      {/* Bulk action bar — Pro Sellers only */}
      {isProSeller && selectedInTab.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <span className="text-sm font-medium text-indigo-800">
            {selectedInTab.length} selected
          </span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {tab === "expired" && (
              <>
                <button
                  onClick={bulkRenew}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  Renew All
                </button>
                <button
                  onClick={bulkRelist}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Relist All
                </button>
              </>
            )}
            {tab === "sold" && (
              <button
                onClick={bulkReactivate}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                Re-activate
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
          {/* Select-all header — Pro Sellers only */}
          {isProSeller && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <SelectIcon className="w-4 h-4" />
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
          )}

          {filtered.map((listing) => {
            const isSelected = selected.has(listing.id);
            return (
              <div
                key={listing.id}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-indigo-50/40" : ""}`}
              >
                {/* Checkbox — Pro Sellers only */}
                {isProSeller && (
                  <button
                    onClick={() => toggleSelect(listing.id)}
                    className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}

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
                  {listing.is_urgent &&
                    !listing.is_promoted &&
                    listing.status !== "sold" && (
                      <span className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                        ⚡
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
                    className="font-medium text-gray-900 text-sm hover:text-indigo-600 truncate block"
                  >
                    {listing.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(listing.price, listing.currency)}
                    </span>
                    <span>·</span>
                    <span>{unwrap(listing.locations)?.name || "Cyprus"}</span>
                    <span>·</span>
                    <span>{timeAgo(listing.created_at)}</span>
                    {(() => {
                      const badge = expiryBadge(
                        listing.expires_at,
                        listing.status,
                      );
                      if (!badge) return null;
                      return (
                        <>
                          <span>·</span>
                          <span
                            className={`flex items-center gap-0.5 font-medium ${badge.critical ? "text-red-500" : "text-amber-500"}`}
                          >
                            <Clock className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </>
                      );
                    })()}
                    {listing.is_promoted &&
                      listing.promoted_until &&
                      listing.status === "active" &&
                      (() => {
                        const days = Math.max(
                          0,
                          Math.ceil(
                            (new Date(listing.promoted_until).getTime() -
                              Date.now()) /
                              86_400_000,
                          ),
                        );
                        return (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 font-medium">
                              ✦ Featured · {days}d left
                            </span>
                          </>
                        );
                      })()}
                    {listing.is_urgent &&
                      listing.boosted_until &&
                      listing.status === "active" &&
                      (() => {
                        const days = Math.max(
                          0,
                          Math.ceil(
                            (new Date(listing.boosted_until).getTime() -
                              Date.now()) /
                              86_400_000,
                          ),
                        );
                        return (
                          <>
                            <span>·</span>
                            <span className="text-red-500 font-medium">
                              ⚡ Boosted · {days}d left
                            </span>
                          </>
                        );
                      })()}
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

                {/* Renew CTA — expiring-soon active listings */}
                {listing.status === "active" &&
                  expiryBadge(listing.expires_at, listing.status) && (
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "renew",
                          listingId: listing.id,
                          listingTitle: listing.title,
                        })
                      }
                      disabled={loadingAction === listing.id}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {loadingAction === listing.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      Renew
                    </button>
                  )}

                {/* Renew + Relist CTAs — expired listings */}
                {listing.status === "expired" && (
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "renew",
                          listingId: listing.id,
                          listingTitle: listing.title,
                        })
                      }
                      disabled={loadingAction === listing.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {loadingAction === listing.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      Renew
                    </button>
                    <button
                      onClick={() => relistListing(listing.id)}
                      disabled={loadingAction === listing.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Relist
                    </button>
                  </div>
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
                      {listing.status === "active" &&
                        !listing.is_promoted &&
                        !listing.is_urgent && (
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
                          onClick={() => {
                            setOpenMenu(null);
                            setConfirmAction({
                              type: "sold",
                              listingId: listing.id,
                              listingTitle: listing.title,
                            });
                          }}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark as Sold
                        </button>
                      )}
                      {listing.status === "sold" && (
                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            setConfirmAction({
                              type: "reactivate",
                              listingId: listing.id,
                              listingTitle: listing.title,
                            });
                          }}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      )}
                      {listing.status === "active" && (
                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            setConfirmAction({
                              type: "renew",
                              listingId: listing.id,
                              listingTitle: listing.title,
                            });
                          }}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 w-full"
                        >
                          <Clock className="w-3.5 h-3.5" /> Renew (30 days)
                        </button>
                      )}
                      {listing.status === "expired" && (
                        <>
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              setConfirmAction({
                                type: "renew",
                                listingId: listing.id,
                                listingTitle: listing.title,
                              });
                            }}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 w-full"
                          >
                            <Clock className="w-3.5 h-3.5" /> Renew listing
                          </button>
                          <button
                            onClick={() => relistListing(listing.id)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Relist as new
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          setConfirmAction({
                            type: "delete",
                            listingId: listing.id,
                            listingTitle: listing.title,
                          });
                        }}
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
        <EmptyState
          emoji={tab === "active" ? "📦" : tab === "sold" ? "✅" : "⏳"}
          title={`No ${tab} listings`}
        />
      )}

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete ${selectedInTab.length} listing${selectedInTab.length !== 1 ? "s" : ""}?`}
        description="This action is permanent and cannot be undone."
        confirmLabel="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        loading={bulkLoading}
        onConfirm={bulkDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Single-item: Delete */}
      <ConfirmDialog
        open={confirmAction?.type === "delete"}
        title="Delete listing?"
        description={`"${confirmAction?.listingTitle}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        loading={loadingAction !== null}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Single-item: Mark as Sold */}
      <ConfirmDialog
        open={confirmAction?.type === "sold"}
        title="Mark as sold?"
        description={`"${confirmAction?.listingTitle}" will be moved to your sold listings and will no longer be visible to buyers.`}
        confirmLabel="Mark as Sold"
        confirmClassName="bg-green-600 hover:bg-green-700"
        loading={loadingAction !== null}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Single-item: Renew */}
      <ConfirmDialog
        open={confirmAction?.type === "renew"}
        title="Renew listing?"
        description={`"${confirmAction?.listingTitle}" will be renewed for another 30 days.`}
        confirmLabel="Renew"
        confirmClassName="bg-indigo-600 hover:bg-indigo-700"
        loading={loadingAction !== null}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Single-item: Reactivate */}
      <ConfirmDialog
        open={confirmAction?.type === "reactivate"}
        title="Reactivate listing?"
        description={`"${confirmAction?.listingTitle}" will be moved back to your active listings and visible to buyers again.`}
        confirmLabel="Reactivate"
        confirmClassName="bg-indigo-600 hover:bg-indigo-700"
        loading={loadingAction !== null}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
