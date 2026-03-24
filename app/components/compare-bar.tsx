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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0 hidden sm:block">
          Compare
        </span>

        {/* Slots */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          {slots.map((listing, i) =>
            listing ? (
              <div
                key={listing.id}
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 min-w-0 flex-1 max-w-[200px] border border-gray-200"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative">
                  {listing.primary_image_url ? (
                    <Image
                      src={listing.primary_image_url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base">
                      📦
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-800 truncate flex-1">
                  {listing.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(listing.id)}
                  className="shrink-0 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Remove from comparison"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                key={i}
                className="flex-1 max-w-[200px] h-[52px] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hidden sm:flex"
              >
                <span className="text-xs text-gray-400">
                  {3 - items.length} slot{3 - items.length !== 1 ? "s" : ""} left
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
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/compare?ids=${items.map((l) => l.id).join(",")}`,
              )
            }
            disabled={items.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare {items.length}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
