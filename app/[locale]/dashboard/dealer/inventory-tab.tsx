"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  FileSpreadsheet,
  Loader2,
  Megaphone,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";

import { revalidateListings } from "@/app/actions/revalidate";
import type { SellerTier } from "@/lib/pricing-config";
import { getPlanLimits } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/client";
import CSVImport, { detectShopType } from "./csv-import";
import type { ListingRow } from "./types";
import { STATUS_BADGE } from "./types";

const PAGE_SIZES = [10, 25, 50] as const;

type SortKey =
  | "title"
  | "status"
  | "price"
  | "view_count"
  | "favorite_count"
  | "created_at";
type SortDir = "asc" | "desc";

type Props = {
  listings: ListingRow[];
  planTier?: SellerTier;
  /** ISO date string — start of the current billing cycle for boost counting */
  planStartedAt?: string | null;
  editBaseHref?: string;
  /** Href for the "Add Inventory" / "New Listing" button */
  newListingHref?: string;
  /** Label for the new-listing button */
  newListingLabel?: string;
  /** Called after mutations to re-fetch listing data */
  onRefresh?: () => void | Promise<void>;
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return (
      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    );
  return dir === "asc" ? (
    <ArrowUp className="w-3 h-3 text-[#8E7A6B]" />
  ) : (
    <ArrowDown className="w-3 h-3 text-[#8E7A6B]" />
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ── Stock badge (click to edit inline) ─────────────────────────────────────
function StockBadge({
  quantity,
  threshold,
  listingId,
  onUpdated,
}: {
  quantity: number;
  threshold: number;
  listingId: string;
  onUpdated?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(quantity));
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("listings").update({ quantity: num }).eq("id", listingId);
    setSaving(false);
    setEditing(false);
    onUpdated?.();
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="w-14 text-xs text-right border border-[#8E7A6B] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#8E7A6B]"
          autoFocus
          disabled={saving}
        />
        <button onClick={save} disabled={saving} className="text-emerald-600 hover:text-emerald-700">
          <Check className="w-3 h-3" />
        </button>
        <button onClick={() => setEditing(false)} className="text-[#8a8280] hover:text-[#1a1a1a]">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const badge = quantity === 0 ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
      Out of stock
    </span>
  ) : quantity <= threshold ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
      {quantity} left
    </span>
  ) : (
    <span className="text-xs text-[#6b6560]">{quantity}</span>
  );

  return (
    <button
      onClick={() => { setValue(String(quantity)); setEditing(true); }}
      className="hover:opacity-70 transition-opacity cursor-pointer"
      title="Click to edit stock"
    >
      {badge}
    </button>
  );
}

// ── Checkbox component ──────────────────────────────────────────────────────
function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const isOn = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      onClick={onChange}
      disabled={disabled}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
        isOn
          ? "bg-[#8E7A6B] border-[#8E7A6B] text-white"
          : "border-[#c5c0bb] bg-white hover:border-[#8E7A6B]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {indeterminate && <Minus className="w-3 h-3" strokeWidth={3} />}
      {checked && !indeterminate && (
        <Check className="w-3 h-3" strokeWidth={3} />
      )}
    </button>
  );
}

// ── Promo usage bar ────────────────────────────────────────────────────────
function PromoUsageBar({
  listings,
  boostsPerMonth,
  tier,
  tierLabel,
  planStartedAt,
}: {
  listings: ListingRow[];
  boostsPerMonth: number;
  tier: string;
  tierLabel: string;
  planStartedAt?: string | null;
}) {
  // Count boosts used in the current billing cycle
  const cycleBoosts = useMemo(() => {
    if (!planStartedAt) {
      // Fallback: count currently promoted
      return listings.filter((l) => l.is_promoted).length;
    }
    const cycleStart = new Date(planStartedAt).getTime();
    return listings.filter(
      (l) => l.promoted_at && new Date(l.promoted_at).getTime() >= cycleStart,
    ).length;
  }, [listings, planStartedAt]);

  const activePromos = cycleBoosts;
  const used = Math.min(activePromos, boostsPerMonth);
  const remaining = Math.max(boostsPerMonth - activePromos, 0);
  const pct = Math.round((used / boostsPerMonth) * 100);

  return (
    <div className="bg-white border border-[#e8e6e3] p-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#1a1a1a]">
              Promoted Listings
            </span>
            <span className="text-[10px] font-medium text-[#8a8280] ml-2 uppercase tracking-wider">
              {tierLabel} Plan
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-lg font-bold text-[#1a1a1a]">{activePromos}</span>
            <span className="text-sm text-[#8a8280]"> / {boostsPerMonth}</span>
          </div>
          {remaining > 0 && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              {remaining} left
            </span>
          )}
          {remaining === 0 && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
              All used
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#f0eeeb] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 100
              ? "bg-amber-500"
              : pct >= 70
                ? "bg-amber-400"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Promo listing chips */}
      {activePromos > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <Megaphone className="w-3 h-3 text-[#8a8280] shrink-0" />
          {listings
            .filter((l) => l.is_promoted)
            .slice(0, 5)
            .map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full truncate max-w-[160px]"
              >
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                {l.title}
              </span>
            ))}
          {activePromos > 5 && (
            <span className="text-[10px] text-[#8a8280] font-medium">
              +{activePromos - 5} more
            </span>
          )}
        </div>
      )}

      {activePromos === 0 && (
        <p className="text-xs text-[#8a8280] mt-2">
          Promote your listings to get more visibility. You have {boostsPerMonth} free boosts this month.
        </p>
      )}
    </div>
  );
}

export default function InventoryTab({
  listings,
  planTier = "starter",
  planStartedAt,
  editBaseHref = "/dashboard/edit",
  newListingHref = "/post",
  newListingLabel = "New Listing",
  onRefresh,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const limits = getPlanLimits(planTier);
  const shopType = useMemo(() => detectShopType(listings), [listings]);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Sort ──────────────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" || key === "status" ? "asc" : "desc");
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    const copy = [...listings];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "price":
          cmp = (a.price ?? -1) - (b.price ?? -1);
          break;
        case "view_count":
          cmp = a.view_count - b.view_count;
          break;
        case "favorite_count":
          cmp = a.favorite_count - b.favorite_count;
          break;
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [listings, sortKey, sortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeP = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safeP - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safeP, pageSize]);

  const rangeStart = sorted.length > 0 ? (safeP - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safeP * pageSize, sorted.length);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  const pageIds = useMemo(() => paginated.map((l) => l.id), [paginated]);
  const allIds = useMemo(() => sorted.map((l) => l.id), [sorted]);

  const pageSelectedCount = useMemo(
    () => pageIds.filter((id) => selected.has(id)).length,
    [pageIds, selected],
  );
  const allPageSelected = pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        // Deselect all on current page
        pageIds.forEach((id) => next.delete(id));
      } else {
        // Select all on current page
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageSelected, pageIds]);

  const selectAll = useCallback(() => {
    setSelected(new Set(allIds));
  }, [allIds]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  // ── Derived selection info ────────────────────────────────────────────────
  const selectedListings = useMemo(
    () => listings.filter((l) => selected.has(l.id)),
    [listings, selected],
  );
  const selectedActivatable = useMemo(
    () => selectedListings.filter((l) => l.status === "draft" || l.status === "paused"),
    [selectedListings],
  );
  const selectedPausable = useMemo(
    () => selectedListings.filter((l) => l.status === "active"),
    [selectedListings],
  );

  // ── Bulk actions ──────────────────────────────────────────────────────────
  async function bulkUpdateStatus(ids: string[], status: string) {
    if (ids.length === 0) return;
    setBulkAction(status);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          supabase.from("listings").update({ status }).eq("id", id),
        ),
      );
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        toast.error(`Failed to update ${errors.length} listing(s)`, {
          description: errors[0].error?.message ?? "Please try again.",
        });
      } else {
        const label = status === "active" ? "activated" : "paused";
        toast.success(
          `${ids.length} listing${ids.length !== 1 ? "s" : ""} ${label}`,
        );
      }
      setSelected(new Set());
      // Bust the server-side listing cache so detail pages reflect the new status
      await revalidateListings();
      if (onRefresh) await onRefresh();
      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setBulkAction(null);
    }
  }

  async function handleImportClose() {
    setShowImport(false);
    if (onRefresh) await onRefresh();
    router.refresh();
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const showDeleteConfirm = deleteIds.length > 0;

  async function handleDelete(mode: "soft" | "hard") {
    if (deleteIds.length === 0) return;
    const actionKey = mode === "hard" ? "hard-delete" : "removed";
    setBulkAction(actionKey);
    try {
      let errorCount = 0;
      let firstError = "";

      if (mode === "soft") {
        const results = await Promise.all(
          deleteIds.map((id) =>
            supabase.from("listings").update({ status: "removed" }).eq("id", id),
          ),
        );
        const errors = results.filter((r) => r.error);
        errorCount = errors.length;
        firstError = errors[0]?.error?.message ?? "";
      } else {
        // Hard delete — listing_images cascade automatically
        const results = await Promise.all(
          deleteIds.map((id) =>
            supabase.from("listings").delete().eq("id", id),
          ),
        );
        const errors = results.filter((r) => r.error);
        errorCount = errors.length;
        firstError = errors[0]?.error?.message ?? "";
      }

      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} listing(s)`, {
          description: firstError || "Please try again.",
        });
      } else {
        const label = mode === "hard" ? "permanently deleted" : "removed";
        toast.success(
          `${deleteIds.length} listing${deleteIds.length !== 1 ? "s" : ""} ${label}`,
        );
      }
      setSelected(new Set());
      setDeleteIds([]);
      if (onRefresh) await onRefresh();
      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setBulkAction(null);
    }
  }

  const selectedDeletable = useMemo(
    () => selectedListings.filter((l) => l.status !== "removed"),
    [selectedListings],
  );

  const isBusy = bulkAction !== null;
  const hasSelection = selected.size > 0;

  const thBase = "px-4 py-3 font-medium text-[#6b6560] select-none";
  const thBtn =
    "group inline-flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors cursor-pointer";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">
          All Listings ({listings.length})
        </h3>
        <div className="flex items-center gap-2">
          {limits.csvImport && (
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 bg-[#faf9f7] text-[#666] border border-[#e8e6e3] px-4 py-2.5 text-sm font-semibold hover:bg-[#f0eeeb] transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import CSV
            </button>
          )}
          <Link
            href={newListingHref}
            className="inline-flex items-center gap-1.5 bg-[#8E7A6B] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#7A6657] transition-colors shadow-sm shadow-[#8E7A6B]/15"
          >
            <Plus className="w-4 h-4" />
            {newListingLabel}
          </Link>
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImport && <CSVImport onClose={handleImportClose} shopType={shopType} />}

      {/* Promo usage widget — Pro & Business tiers */}
      {limits.freeBoostsPerMonth > 0 && (
        <PromoUsageBar
          listings={listings}
          boostsPerMonth={limits.freeBoostsPerMonth}
          tier={limits.tier}
          tierLabel={limits.tierLabel}
          planStartedAt={planStartedAt}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1a1a1a]">
                  Delete {deleteIds.length} listing{deleteIds.length !== 1 ? "s" : ""}?
                </h3>
                <p className="text-xs text-[#8a8280] mt-0.5">
                  Choose how to handle {deleteIds.length === 1 ? "this listing" : "these listings"}.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {/* Soft delete option */}
              <button
                onClick={() => handleDelete("soft")}
                disabled={isBusy}
                className="w-full text-left px-4 py-3 border border-[#e8e6e3] hover:border-[#8E7A6B] hover:bg-[#faf9f7] transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    Remove from shop
                  </span>
                  {bulkAction === "removed" && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8E7A6B]" />
                  )}
                </div>
                <p className="text-xs text-[#8a8280] mt-0.5">
                  Hidden from buyers but kept in your records. You can restore {deleteIds.length === 1 ? "it" : "them"} later.
                </p>
              </button>

              {/* Hard delete option */}
              <button
                onClick={() => handleDelete("hard")}
                disabled={isBusy}
                className="w-full text-left px-4 py-3 border border-red-200 hover:border-red-400 hover:bg-red-50/50 transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-700">
                    Delete permanently
                  </span>
                  {bulkAction === "hard-delete" && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  )}
                </div>
                <p className="text-xs text-red-400 mt-0.5">
                  Permanently erased — listing data and images cannot be recovered.
                </p>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setDeleteIds([])}
                disabled={isBusy}
                className="px-4 py-2 text-sm font-medium text-[#666] hover:bg-[#f0eeeb] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection toolbar — appears when items are selected */}
      {hasSelection ? (
        <div className="flex items-center gap-3 bg-[#8E7A6B]/5 border border-[#8E7A6B]/20 px-4 py-2.5 text-sm">
          <span className="font-medium text-[#2C2826]">
            {selected.size} selected
          </span>

          {/* Select all across pages hint */}
          {selected.size < sorted.length && (
            <button
              onClick={selectAll}
              className="text-xs text-[#8E7A6B] hover:text-[#7A6657] font-medium underline underline-offset-2"
            >
              Select all {sorted.length}
            </button>
          )}

          <div className="flex-1" />

          {/* Activate selected */}
          <button
            onClick={() =>
              bulkUpdateStatus(
                selectedActivatable.map((l) => l.id),
                "active",
              )
            }
            disabled={selectedActivatable.length === 0 || isBusy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkAction === "active" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : null}
            Activate
            {selectedActivatable.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {selectedActivatable.length}
              </span>
            )}
          </button>

          {/* Pause selected */}
          <button
            onClick={() =>
              bulkUpdateStatus(
                selectedPausable.map((l) => l.id),
                "paused",
              )
            }
            disabled={selectedPausable.length === 0 || isBusy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkAction === "paused" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : null}
            Pause
            {selectedPausable.length > 0 && (
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {selectedPausable.length}
              </span>
            )}
          </button>

          {/* Delete selected */}
          <button
            onClick={() =>
              setDeleteIds(selectedDeletable.map((l) => l.id))
            }
            disabled={selectedDeletable.length === 0 || isBusy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkAction === "removed" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Delete
            {selectedDeletable.length > 0 && (
              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {selectedDeletable.length}
              </span>
            )}
          </button>

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            disabled={isBusy}
            className="p-1.5 text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#e8e6e3] transition-colors rounded disabled:opacity-40"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Default bulk actions when nothing is selected */
        <div className="flex gap-2">
          <button
            onClick={() =>
              bulkUpdateStatus(
                listings
                  .filter((l) => l.status === "draft")
                  .map((l) => l.id),
                "active",
              )
            }
            disabled={
              listings.filter((l) => l.status === "draft").length === 0 || isBusy
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkAction === "active" && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            Activate All Drafts
            {listings.filter((l) => l.status === "draft").length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {listings.filter((l) => l.status === "draft").length}
              </span>
            )}
          </button>
          <button
            onClick={() =>
              bulkUpdateStatus(
                listings
                  .filter((l) => l.status === "active")
                  .map((l) => l.id),
                "paused",
              )
            }
            disabled={
              listings.filter((l) => l.status === "active").length === 0 || isBusy
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkAction === "paused" && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            Pause All Active
            {listings.filter((l) => l.status === "active").length > 0 && (
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {listings.filter((l) => l.status === "active").length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Listings table */}
      <div className="bg-white border border-[#e8e6e3] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e6e3] bg-[#faf9f7]/50">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={togglePage}
                  disabled={paginated.length === 0 || isBusy}
                />
              </th>
              <th className={`text-left ${thBase}`}>
                <button
                  onClick={() => toggleSort("title")}
                  className={thBtn}
                >
                  Listing
                  <SortIcon active={sortKey === "title"} dir={sortDir} />
                </button>
              </th>
              <th className={`text-left ${thBase}`}>
                <button
                  onClick={() => toggleSort("status")}
                  className={thBtn}
                >
                  Status
                  <SortIcon active={sortKey === "status"} dir={sortDir} />
                </button>
              </th>
              <th className={`text-right ${thBase}`}>
                <button
                  onClick={() => toggleSort("price")}
                  className={`${thBtn} ml-auto`}
                >
                  Price
                  <SortIcon active={sortKey === "price"} dir={sortDir} />
                </button>
              </th>
              <th className={`text-right ${thBase} hidden md:table-cell`}>
                <button
                  onClick={() => toggleSort("view_count")}
                  className={`${thBtn} ml-auto`}
                >
                  Views
                  <SortIcon active={sortKey === "view_count"} dir={sortDir} />
                </button>
              </th>
              <th className={`text-right ${thBase} hidden md:table-cell`}>
                <button
                  onClick={() => toggleSort("favorite_count")}
                  className={`${thBtn} ml-auto`}
                >
                  Saves
                  <SortIcon
                    active={sortKey === "favorite_count"}
                    dir={sortDir}
                  />
                </button>
              </th>
              {limits.stockManagement && (
                <th className={`text-right ${thBase} hidden md:table-cell`}>
                  Stock
                </th>
              )}
              <th className={`text-right ${thBase} hidden lg:table-cell`}>
                <button
                  onClick={() => toggleSort("created_at")}
                  className={`${thBtn} ml-auto`}
                >
                  Added
                  <SortIcon
                    active={sortKey === "created_at"}
                    dir={sortDir}
                  />
                </button>
              </th>
              <th className={`text-right ${thBase}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#faf9f7]">
            {paginated.map((l) => {
              const isSelected = selected.has(l.id);
              return (
                <tr
                  key={l.id}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-[#8E7A6B]/[0.04]"
                      : "hover:bg-[#faf9f7]/50"
                  }`}
                >
                  <td className="w-10 px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleRow(l.id)}
                      disabled={isBusy}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/listing/${l.slug}`}
                      className="flex items-center gap-3 group/listing"
                    >
                      <div className="w-10 h-10 bg-[#f0eeeb] overflow-hidden shrink-0 relative">
                        {l.primary_image_url && (
                          <Image
                            src={l.primary_image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        )}
                      </div>
                      <span className="font-medium text-[#1a1a1a] truncate max-w-[200px] group-hover/listing:text-[#8E7A6B] transition-colors">
                        {l.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[l.status] || "bg-[#f0eeeb] text-[#6b6560]"}`}
                    >
                      {l.status}
                    </span>
                    {l.is_promoted && (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-600">
                        &#10022;
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#1a1a1a]">
                    {l.price != null
                      ? `\u20AC${l.price.toLocaleString()}`
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b6560] hidden md:table-cell">
                    {l.view_count}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b6560] hidden md:table-cell">
                    {l.favorite_count}
                  </td>
                  {limits.stockManagement && (
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {l.quantity != null ? (
                        <StockBadge quantity={l.quantity} threshold={l.low_stock_threshold ?? 3} listingId={l.id} onUpdated={onRefresh} />
                      ) : (
                        <span className="text-[#8a8280] text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-[#6b6560] text-xs hidden lg:table-cell">
                    {timeAgo(l.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`${editBaseHref}/${l.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657]"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </Link>
                      {l.status === "active" && !l.is_promoted && (
                        <Link
                          href={`/promote/${l.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          <Zap className="w-3 h-3" /> Boost
                        </Link>
                      )}
                      {l.status !== "removed" && (
                        <button
                          onClick={() => setDeleteIds([l.id])}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#8a8280] hover:text-red-600 disabled:opacity-40 transition-colors"
                          aria-label={`Delete ${l.title}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {listings.length === 0 && (
          <div className="text-center py-12 text-[#8a8280]">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#8a8280]" />
            <p className="font-medium">No listings yet</p>
            <p className="text-xs mt-1">
              <Link href={newListingHref} className="text-[#8E7A6B] hover:underline">
                Create your first listing
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {listings.length > PAGE_SIZES[0] && (
        <div className="flex items-center justify-between pt-1">
          {/* Page size selector */}
          <div className="flex items-center gap-2 text-xs text-[#6b6560]">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-[#e8e6e3] bg-white px-2 py-1 text-xs text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#8E7A6B]/30"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>

          {/* Range + controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6b6560]">
              {rangeStart}&ndash;{rangeEnd} of {sorted.length}
            </span>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => goTo(1)}
                disabled={safeP === 1}
                className="p-1 text-[#6b6560] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goTo(safeP - 1)}
                disabled={safeP === 1}
                className="p-1 text-[#6b6560] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - safeP) <= 1) return true;
                  return false;
                })
                .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                  if (idx > 0) {
                    const prev = arr[idx - 1];
                    if (p - prev > 1) acc.push("ellipsis");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e${i}`}
                      className="px-1 text-xs text-[#8a8280]"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => goTo(item)}
                      className={`min-w-[28px] h-7 text-xs font-medium transition-colors ${
                        item === safeP
                          ? "bg-[#8E7A6B] text-white"
                          : "text-[#6b6560] hover:bg-[#faf9f7]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                onClick={() => goTo(safeP + 1)}
                disabled={safeP === totalPages}
                className="p-1 text-[#6b6560] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goTo(totalPages)}
                disabled={safeP === totalPages}
                className="p-1 text-[#6b6560] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
