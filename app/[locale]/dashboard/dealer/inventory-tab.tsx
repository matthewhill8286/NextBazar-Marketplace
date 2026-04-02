"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  FileSpreadsheet,
  Plus,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

import { createClient } from "@/lib/supabase/client";
import CSVImport from "./csv-import";
import type { ListingRow } from "./types";
import { STATUS_BADGE } from "./types";

const PAGE_SIZES = [10, 25, 50] as const;

type Props = {
  listings: ListingRow[];
  editBaseHref?: string;
};

export default function InventoryTab({
  listings,
  editBaseHref = "/dashboard/edit",
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const totalPages = Math.max(1, Math.ceil(listings.length / pageSize));

  // Reset to page 1 when listings change or page size changes
  const safeP = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safeP - 1) * pageSize;
    return listings.slice(start, start + pageSize);
  }, [listings, safeP, pageSize]);

  const rangeStart = (safeP - 1) * pageSize + 1;
  const rangeEnd = Math.min(safeP * pageSize, listings.length);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  async function bulkUpdateStatus(ids: string[], status: string) {
    for (const id of ids) {
      await supabase.from("listings").update({ status }).eq("id", id);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">
          All Listings ({listings.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 bg-[#faf9f7] text-[#666] border border-[#e8e6e3] px-4 py-2.5 text-sm font-semibold hover:bg-[#f0eeeb] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import CSV
          </button>
          <Link
            href="/post"
            className="inline-flex items-center gap-1.5 bg-[#8E7A6B] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#7A6657] transition-colors shadow-sm shadow-[#8E7A6B]/15"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImport && <CSVImport onClose={() => setShowImport(false)} />}

      {/* Bulk actions */}
      <div className="flex gap-2">
        <button
          onClick={() =>
            bulkUpdateStatus(
              listings.filter((l) => l.status === "draft").map((l) => l.id),
              "active",
            )
          }
          className="text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          Activate All Drafts
        </button>
        <button
          onClick={() =>
            bulkUpdateStatus(
              listings.filter((l) => l.status === "active").map((l) => l.id),
              "paused",
            )
          }
          className="text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          Pause All Active
        </button>
      </div>

      {/* Listings table */}
      <div className="bg-white border border-[#e8e6e3] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e6e3] bg-[#faf9f7]/50">
              <th className="text-left px-4 py-3 font-medium text-[#6b6560]">
                Listing
              </th>
              <th className="text-left px-4 py-3 font-medium text-[#6b6560]">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560]">
                Price
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560] hidden md:table-cell">
                Views
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560] hidden md:table-cell">
                Saves
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#faf9f7]">
            {paginated.map((l) => (
              <tr
                key={l.id}
                className="hover:bg-[#faf9f7]/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
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
                    <span className="font-medium text-[#1a1a1a] truncate max-w-[200px]">
                      {l.title}
                    </span>
                  </div>
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
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${editBaseHref}/${l.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657]"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && (
          <div className="text-center py-12 text-[#8a8280]">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#8a8280]" />
            <p className="font-medium">No listings yet</p>
            <p className="text-xs mt-1">
              <Link href="/post" className="text-[#8E7A6B] hover:underline">
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
              {rangeStart}&ndash;{rangeEnd} of {listings.length}
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
                  // Show first, last, and pages near current
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
