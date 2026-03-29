"use client";

import { Edit3, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ListingRow } from "./types";

type Props = {
  listings: ListingRow[];
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  sold: "bg-[#f0eeeb] text-[#999]",
  draft: "bg-amber-50 text-amber-700",
  paused: "bg-orange-50 text-orange-600",
  removed: "bg-red-50 text-red-600",
};

export default function InventoryTab({ listings }: Props) {
  const router = useRouter();
  const supabase = createClient();

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
        <Link
          href="/post"
          className="inline-flex items-center gap-1.5 bg-[#8E7A6B] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#7A6657] transition-colors shadow-sm shadow-[#8E7A6B]/15"
        >
          <Plus className="w-4 h-4" />
          New Listing
        </Link>
      </div>

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
              <th className="text-left px-4 py-3 font-medium text-[#999]">
                Listing
              </th>
              <th className="text-left px-4 py-3 font-medium text-[#999]">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#999]">
                Price
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#999] hidden md:table-cell">
                Views
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#999] hidden md:table-cell">
                Saves
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#999]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#faf9f7]">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-[#faf9f7]/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f0eeeb] overflow-hidden shrink-0">
                      {l.primary_image_url && (
                        <img
                          src={l.primary_image_url}
                          alt=""
                          className="w-full h-full object-cover"
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
                    className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[l.status] || "bg-[#f0eeeb] text-[#999]"}`}
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
                <td className="px-4 py-3 text-right text-[#999] hidden md:table-cell">
                  {l.view_count}
                </td>
                <td className="px-4 py-3 text-right text-[#999] hidden md:table-cell">
                  {l.favorite_count}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/edit/${l.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && (
          <div className="text-center py-12 text-[#bbb]">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#ccc]" />
            <p className="font-medium">No listings yet</p>
            <p className="text-xs mt-1">
              <Link href="/post" className="text-indigo-600 hover:underline">
                Create your first listing
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
