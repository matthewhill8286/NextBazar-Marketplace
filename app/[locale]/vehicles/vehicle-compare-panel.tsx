"use client";

import {
  ArrowRight,
  Calendar,
  Fuel,
  Gauge,
  GitCompareArrows,
  Settings2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCompare } from "@/lib/compare-context";
import { FALLBACK_LISTING_IMAGE } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import { getAttr } from "@/app/helpers/get-attr";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Contact";
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${price.toLocaleString()}`;
}

// ─── Spec rows to compare ───────────────────────────────────────────────────

const SPEC_ROWS = [
  { key: "year", label: "Year", icon: Calendar },
  { key: "mileage", label: "Mileage", icon: Gauge, suffix: " km" },
  { key: "fuel_type", label: "Fuel", icon: Fuel },
  { key: "transmission", label: "Transmission", icon: Settings2 },
  { key: "body_type", label: "Body Type", icon: null },
  { key: "engine_size", label: "Engine", icon: null, suffix: " cc" },
  { key: "drive_type", label: "Drive", icon: null },
  { key: "color", label: "Color", icon: null },
  { key: "doors", label: "Doors", icon: null },
  { key: "owners", label: "Owners", icon: null },
  { key: "service_history", label: "Service History", icon: null },
];

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  /** Full listing data with attributes — comes from the enriched listing set */
  enrichedItems: Record<string, unknown>[];
};

export default function VehicleComparePanel({ enrichedItems }: Props) {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  // Match compare items to enriched data (which has attributes)
  const compareData = items.map((item) => {
    const enriched = enrichedItems.find(
      (e) => (e as { id: string }).id === item.id,
    );
    return { ...item, ...(enriched ?? {}) };
  });

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 bg-[#2C2826]">
            <GitCompareArrows className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-light text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Compare Vehicles
            </h2>
            <p className="text-xs text-[#8a8280]">
              {items.length} of 3 selected
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {items.length >= 2 && (
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a1a1a] hover:text-[#666] transition-colors"
            >
              Full comparison <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          <button
            onClick={clear}
            className="text-xs text-[#8a8280] hover:text-[#1a1a1a] transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e8e6e3] overflow-hidden">
        {/* Header row with vehicle images + names */}
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(${compareData.length}, 1fr)` }}>
          <div className="p-4 bg-[#faf9f7] border-r border-[#e8e6e3]" />
          {compareData.map((item) => (
            <div
              key={item.id}
              className="p-4 border-r border-[#e8e6e3] last:border-r-0"
            >
              <div className="relative">
                <button
                  onClick={() => remove(item.id)}
                  className="absolute -top-1 -right-1 z-10 w-6 h-6 bg-[#2C2826] text-white flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="relative aspect-video mb-3 bg-[#f0eeeb] overflow-hidden">
                  <Image
                    src={item.primary_image_url || FALLBACK_LISTING_IMAGE}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <Link
                  href={`/listing/${item.slug}`}
                  className="text-sm font-medium text-[#1a1a1a] hover:text-[#666] line-clamp-2 transition-colors"
                >
                  {item.title}
                </Link>
                <p
                  className="text-lg font-semibold text-[#1a1a1a] mt-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {formatPrice(item.price, item.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Spec rows */}
        {SPEC_ROWS.map((spec, idx) => {
          const values = compareData.map((item) => {
            const val = getAttr(item as ListingCardRow, spec.key);
            if (val === "—") return val;
            const formatted = spec.key === "mileage" && val !== "—"
              ? parseInt(val, 10).toLocaleString()
              : val.charAt(0).toUpperCase() + val.slice(1);
            return formatted + (spec.suffix && val !== "—" ? spec.suffix : "");
          });

          // Find best value for highlighting (lowest mileage, newest year, etc.)
          const numericValues = compareData.map((item) => {
            const raw = getAttr(item as ListingCardRow, spec.key);
            return parseInt(raw, 10);
          });

          let bestIndex = -1;
          if (spec.key === "year") {
            const max = Math.max(...numericValues.filter((v) => !isNaN(v)));
            bestIndex = numericValues.indexOf(max);
          } else if (spec.key === "mileage") {
            const validValues = numericValues.filter((v) => !isNaN(v));
            if (validValues.length > 0) {
              const min = Math.min(...validValues);
              bestIndex = numericValues.indexOf(min);
            }
          } else if (spec.key === "owners") {
            const validValues = numericValues.filter((v) => !isNaN(v));
            if (validValues.length > 0) {
              const min = Math.min(...validValues);
              bestIndex = numericValues.indexOf(min);
            }
          }

          return (
            <div
              key={spec.key}
              className={`grid border-t border-[#e8e6e3] ${idx % 2 === 0 ? "bg-white" : "bg-[#faf9f7]/50"}`}
              style={{ gridTemplateColumns: `160px repeat(${compareData.length}, 1fr)` }}
            >
              <div className="p-3 pr-4 border-r border-[#e8e6e3] flex items-center gap-2">
                {spec.icon && <spec.icon className="w-3.5 h-3.5 text-[#8a8280]" />}
                <span className="text-xs font-medium text-[#8a8280] tracking-wide uppercase">
                  {spec.label}
                </span>
              </div>
              {values.map((val, i) => (
                <div
                  key={compareData[i].id}
                  className={`p-3 border-r border-[#e8e6e3] last:border-r-0 text-sm ${
                    bestIndex === i && compareData.length > 1
                      ? "text-[#5a7a4a] font-semibold"
                      : "text-[#1a1a1a]"
                  }`}
                >
                  {val}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
