"use client";

import {
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";
import { getAttr } from "@/app/helpers/get-attr";

// ─── Filter option constants ────────────────────────────────────────────────

const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "studio",
  "penthouse",
  "townhouse",
  "bungalow",
  "duplex",
] as const;

const BEDROOM_OPTIONS = ["studio", "1", "2", "3", "4", "5+"] as const;
const BATHROOM_OPTIONS = ["1", "2", "3", "4+"] as const;

const FURNISHING_OPTIONS = [
  "furnished",
  "semi-furnished",
  "unfurnished",
] as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export type PropertyFilterState = {
  search: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  furnishing: string;
  condition: string;
};

const EMPTY_FILTERS: PropertyFilterState = {
  search: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  areaMax: "",
  furnishing: "",
  condition: "",
};

// ─── Filter function (exported for parent) ──────────────────────────────────

export function applyPropertyFilters(
  listings: ListingCardRow[],
  filters: PropertyFilterState,
): ListingCardRow[] {
  return listings.filter((l) => {
    // Text search — check title, property_type attribute, location
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const title = l.title?.toLowerCase() ?? "";
      const pType = getAttr(l, "property_type").toLowerCase();
      const loc = l.locations?.name?.toLowerCase() ?? "";
      if (!title.includes(q) && !pType.includes(q) && !loc.includes(q)) {
        return false;
      }
    }

    // Property type
    if (
      filters.propertyType &&
      getAttr(l, "property_type").toLowerCase() !== filters.propertyType
    ) {
      // Also check title as fallback since property_type may not be set
      if (!l.title?.toLowerCase().includes(filters.propertyType)) {
        return false;
      }
    }

    // Bedrooms
    if (filters.bedrooms) {
      const beds = getAttr(l, "bedrooms");
      if (beds) {
        const bedsNum = parseInt(beds, 10);
        if (filters.bedrooms === "studio" && bedsNum !== 0) return false;
        if (filters.bedrooms === "5+" && bedsNum < 5) return false;
        if (
          filters.bedrooms !== "studio" &&
          filters.bedrooms !== "5+" &&
          bedsNum !== parseInt(filters.bedrooms, 10)
        ) {
          return false;
        }
      }
    }

    // Bathrooms
    if (filters.bathrooms) {
      const baths = getAttr(l, "bathrooms");
      if (baths) {
        const bathsNum = parseInt(baths, 10);
        if (filters.bathrooms === "4+" && bathsNum < 4) return false;
        if (
          filters.bathrooms !== "4+" &&
          bathsNum !== parseInt(filters.bathrooms, 10)
        ) {
          return false;
        }
      }
    }

    // Price range
    if (
      filters.priceMin &&
      l.price !== null &&
      l.price < parseInt(filters.priceMin, 10)
    ) {
      return false;
    }
    if (
      filters.priceMax &&
      l.price !== null &&
      l.price > parseInt(filters.priceMax, 10)
    ) {
      return false;
    }

    // Area (sqm)
    const area = parseInt(getAttr(l, "area_sqm"), 10);
    if (filters.areaMin && !isNaN(area) && area < parseInt(filters.areaMin, 10)) {
      return false;
    }
    if (filters.areaMax && !isNaN(area) && area > parseInt(filters.areaMax, 10)) {
      return false;
    }

    // Furnishing
    if (
      filters.furnishing &&
      getAttr(l, "furnishing").toLowerCase() !== filters.furnishing
    ) {
      return false;
    }

    // Condition
    if (filters.condition && l.condition !== filters.condition) {
      return false;
    }

    return true;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  listings: ListingCardRow[];
  filters: PropertyFilterState;
  onFiltersChange: (filters: PropertyFilterState) => void;
  resultCount: number;
};

const SELECT_CLASSES =
  "w-full px-3 py-2.5 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white appearance-none cursor-pointer";

const INPUT_CLASSES =
  "w-full px-3 py-2.5 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white";

export default function PropertyFilters({
  listings,
  filters,
  onFiltersChange,
  resultCount,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.propertyType) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.priceMin) count++;
    if (filters.priceMax) count++;
    if (filters.areaMin) count++;
    if (filters.areaMax) count++;
    if (filters.furnishing) count++;
    if (filters.condition) count++;
    return count;
  }, [filters]);

  const update = useCallback(
    (key: keyof PropertyFilterState, value: string) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange],
  );

  const reset = useCallback(() => {
    onFiltersChange(EMPTY_FILTERS);
  }, [onFiltersChange]);

  return (
    <div className="bg-white border border-[#e8e6e3] mb-8">
      {/* Quick search + toggle row */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8280]" />
          <input
            type="text"
            placeholder="Search by location, property type, or keyword..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className={`${INPUT_CLASSES} pl-10`}
          />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            expanded || activeFilterCount > 0
              ? "bg-[#8E7A6B] text-white"
              : "bg-[#faf9f7] text-[#666] hover:bg-[#f0eeeb]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 ml-1">
              {activeFilterCount}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="border-t border-[#e8e6e3] p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Property Type */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Property Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => update("propertyType", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => update("bedrooms", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b === "studio" ? "Studio" : `${b} Bed`}
                  </option>
                ))}
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Bathrooms
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) => update("bathrooms", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {BATHROOM_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b} Bath
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => update("condition", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                <option value="new">New Build</option>
                <option value="like_new">Renovated</option>
                <option value="good">Good Condition</option>
                <option value="fair">Needs Work</option>
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Min Price
              </label>
              <input
                type="number"
                placeholder="€0"
                value={filters.priceMin}
                onChange={(e) => update("priceMin", e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Max Price
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.priceMax}
                onChange={(e) => update("priceMax", e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            {/* Area range */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Min Area (m²)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.areaMin}
                onChange={(e) => update("areaMin", e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Max Area (m²)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.areaMax}
                onChange={(e) => update("areaMax", e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            {/* Furnishing */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Furnishing
              </label>
              <select
                value={filters.furnishing}
                onChange={(e) => update("furnishing", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {FURNISHING_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter actions row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0eeeb]">
            <div className="flex items-center gap-2 text-sm text-[#8a8280]">
              <Filter className="w-3.5 h-3.5" />
              <span>
                <span className="font-semibold text-[#1a1a1a]">
                  {resultCount}
                </span>{" "}
                {resultCount === 1 ? "property" : "properties"} found
              </span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-sm text-[#8a8280] hover:text-[#1a1a1a] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
