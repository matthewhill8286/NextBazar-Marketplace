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
import { getAttr } from "@/app/helpers/get-attr";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

// ─── Filter option constants ────────────────────────────────────────────────

const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid", "lpg"] as const;
const TRANSMISSIONS = ["automatic", "manual"] as const;
const BODY_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "convertible",
  "wagon",
  "van",
  "truck",
  "pickup",
] as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export type VehicleFilterState = {
  search: string;
  make: string;
  model: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  mileageMax: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
};

const EMPTY_FILTERS: VehicleFilterState = {
  search: "",
  make: "",
  model: "",
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  mileageMax: "",
  fuelType: "",
  transmission: "",
  bodyType: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract unique makes from listings */
function extractMakes(listings: ListingCardRow[]): string[] {
  const makes = new Set<string>();
  for (const l of listings) {
    const make = getAttr(l, "make");
    if (make) makes.add(make);
  }
  return Array.from(makes).sort();
}

/** Extract unique models for a given make */
function extractModels(listings: ListingCardRow[], make: string): string[] {
  const models = new Set<string>();
  for (const l of listings) {
    if (getAttr(l, "make").toLowerCase() === make.toLowerCase()) {
      const model = getAttr(l, "model");
      if (model) models.add(model);
    }
  }
  return Array.from(models).sort();
}

// ─── Filter function (exported for use by parent) ───────────────────────────

export function applyVehicleFilters(
  listings: ListingCardRow[],
  filters: VehicleFilterState,
): ListingCardRow[] {
  return listings.filter((l) => {
    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const title = l.title?.toLowerCase() ?? "";
      const make = getAttr(l, "make").toLowerCase();
      const model = getAttr(l, "model").toLowerCase();
      if (!title.includes(q) && !make.includes(q) && !model.includes(q)) {
        return false;
      }
    }

    // Make
    if (
      filters.make &&
      getAttr(l, "make").toLowerCase() !== filters.make.toLowerCase()
    ) {
      return false;
    }

    // Model
    if (
      filters.model &&
      getAttr(l, "model").toLowerCase() !== filters.model.toLowerCase()
    ) {
      return false;
    }

    // Year range
    const year = parseInt(getAttr(l, "year"), 10);
    if (
      filters.yearMin &&
      !Number.isNaN(year) &&
      year < parseInt(filters.yearMin, 10)
    ) {
      return false;
    }
    if (
      filters.yearMax &&
      !Number.isNaN(year) &&
      year > parseInt(filters.yearMax, 10)
    ) {
      return false;
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

    // Mileage
    const mileage = parseInt(getAttr(l, "mileage"), 10);
    if (
      filters.mileageMax &&
      !Number.isNaN(mileage) &&
      mileage > parseInt(filters.mileageMax, 10)
    ) {
      return false;
    }

    // Fuel type
    if (
      filters.fuelType &&
      getAttr(l, "fuel_type").toLowerCase() !== filters.fuelType
    ) {
      return false;
    }

    // Transmission
    if (
      filters.transmission &&
      getAttr(l, "transmission").toLowerCase() !== filters.transmission
    ) {
      return false;
    }

    // Body type
    if (
      filters.bodyType &&
      getAttr(l, "body_type").toLowerCase() !== filters.bodyType
    ) {
      return false;
    }

    return true;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  listings: ListingCardRow[];
  filters: VehicleFilterState;
  onFiltersChange: (filters: VehicleFilterState) => void;
  resultCount: number;
};

const SELECT_CLASSES =
  "w-full px-3 py-2.5 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white appearance-none cursor-pointer";

const INPUT_CLASSES =
  "w-full px-3 py-2.5 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white";

export default function VehicleFilters({
  listings,
  filters,
  onFiltersChange,
  resultCount,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const makes = useMemo(() => extractMakes(listings), [listings]);
  const models = useMemo(
    () => (filters.make ? extractModels(listings, filters.make) : []),
    [listings, filters.make],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.make) count++;
    if (filters.model) count++;
    if (filters.yearMin) count++;
    if (filters.yearMax) count++;
    if (filters.priceMin) count++;
    if (filters.priceMax) count++;
    if (filters.mileageMax) count++;
    if (filters.fuelType) count++;
    if (filters.transmission) count++;
    if (filters.bodyType) count++;
    return count;
  }, [filters]);

  const update = useCallback(
    (key: keyof VehicleFilterState, value: string) => {
      const next = { ...filters, [key]: value };
      // Reset model when make changes
      if (key === "make") next.model = "";
      onFiltersChange(next);
    },
    [filters, onFiltersChange],
  );

  const reset = useCallback(() => {
    onFiltersChange(EMPTY_FILTERS);
  }, [onFiltersChange]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => String(currentYear - i));

  return (
    <div className="bg-white border border-[#e8e6e3] mb-8">
      {/* Quick search + toggle row */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8280]" />
          <input
            type="text"
            placeholder="Search by make, model, or keyword..."
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
            {/* Make */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Make
              </label>
              <select
                value={filters.make}
                onChange={(e) => update("make", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">All Makes</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Model
              </label>
              <select
                value={filters.model}
                onChange={(e) => update("model", e.target.value)}
                className={SELECT_CLASSES}
                disabled={!filters.make}
              >
                <option value="">All Models</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year range */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Year From
              </label>
              <select
                value={filters.yearMin}
                onChange={(e) => update("yearMin", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Year To
              </label>
              <select
                value={filters.yearMax}
                onChange={(e) => update("yearMax", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
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

            {/* Mileage */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Max Mileage (km)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.mileageMax}
                onChange={(e) => update("mileageMax", e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Fuel Type
              </label>
              <select
                value={filters.fuelType}
                onChange={(e) => update("fuelType", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Transmission
              </label>
              <select
                value={filters.transmission}
                onChange={(e) => update("transmission", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1.5">
                Body Type
              </label>
              <select
                value={filters.bodyType}
                onChange={(e) => update("bodyType", e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Any</option>
                {BODY_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b.charAt(0).toUpperCase() + b.slice(1)}
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
                {resultCount === 1 ? "vehicle" : "vehicles"} found
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
