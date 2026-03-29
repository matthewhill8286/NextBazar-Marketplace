"use client";

import { ArrowRight, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCompare } from "@/lib/compare-context";

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const router = useRouter();

  if (items.length === 0) return null;

  const slots = Array.from({ length: 3 }, (_, i) => items[i] ?? null);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8e6e3] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-xs font-semibold text-[#999] uppercase tracking-wide shrink-0 hidden sm:block">
          Compare
        </span>

        {/* Slots */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          {slots.map((listing, m) =>
            listing ? (
              <div
                key={listing.id}
                className="flex items-center gap-2 bg-[#faf9f7] px-3 py-2 min-w-0 flex-1 max-w-[200px] border border-[#e8e6e3]"
              >
                <div className="w-9 h-9 overflow-hidden bg-[#f0eeeb] shrink-0 relative">
                  {listing.primary_image_url ? (
                    <Image
                      src={listing.primary_image_url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[#bbb]">
                      ◻
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-[#1a1a1a] truncate flex-1">
                  {listing.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(listing.id)}
                  className="shrink-0 p-0.5 hover:bg-[#f0eeeb] text-[#bbb] hover:text-[#666] transition-colors"
                  aria-label="Remove from comparison"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                key={`${listing}-${m}`}
                className="flex-1 max-w-50 h-13 border-2 border-dashed border-[#e8e6e3] flex items-center justify-center hidden sm:flex"
              >
                <span className="text-xs text-[#bbb]">
                  {3 - items.length} slot{3 - items.length !== 1 ? "s" : ""}{" "}
                  left
                </span>
              </div>
            ),
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="text-xs text-[#bbb] hover:text-[#666] transition-colors px-2 py-1 hover:bg-[#f0eeeb]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(`/compare?ids=${items.map((l) => l.id).join(",")}`)
            }
            disabled={items.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2C2826] text-white text-sm font-semibold hover:bg-[#3D3633] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare {items.length}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
