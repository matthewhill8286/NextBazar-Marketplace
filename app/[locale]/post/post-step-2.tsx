"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Car,
  Lightbulb,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";
import type {
  FormData,
  Location,
  PricingData,
  VehicleAttributes,
} from "./post-types";

type Props = {
  formData: Pick<
    FormData,
    | "title"
    | "price"
    | "price_type"
    | "description"
    | "condition"
    | "location_id"
    | "contact_phone"
  >;
  locations: Location[];
  pricingData: PricingData | null;
  pricingLoading: boolean;
  selectedPriceKey: "low" | "suggested" | "high" | null;
  descLoading: boolean;
  isVehicle: boolean;
  vehicleAttrs: VehicleAttributes;
  onUpdateAction: (key: string, value: string) => void;
  onSelectPriceKeyAction: (key: "low" | "suggested" | "high") => void;
  onAiDescriptionAction: () => void;
  onAiPricingAction: () => void;
  onVehicleAttrUpdateAction: (key: keyof VehicleAttributes, value: string) => void;
  onBackAction: () => void;
  onNextAction: () => void;
};

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
const DRIVE_TYPES = [
  { value: "fwd", label: "FWD" },
  { value: "rwd", label: "RWD" },
  { value: "awd", label: "AWD" },
  { value: "4wd", label: "4WD" },
] as const;
const SERVICE_HISTORY = ["full", "partial", "none"] as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const INPUT_CLASSES =
  "w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white";

const VEHICLE_INPUT_CLASSES =
  "w-full px-3 py-2.5 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white";

export default function PostStep2({
  formData,
  locations,
  pricingData,
  pricingLoading,
  selectedPriceKey,
  descLoading,
  isVehicle,
  vehicleAttrs,
  onUpdateAction,
  onSelectPriceKeyAction,
  onAiDescriptionAction,
  onAiPricingAction,
  onVehicleAttrUpdateAction,
  onBackAction,
  onNextAction,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-3xl font-light text-[#1a1a1a] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Details &amp; Pricing
        </h2>
        <p className="text-sm text-[#6b6560]">
          The more detail you add, the faster it sells
        </p>
      </div>

      {/* Description with AI writer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560]">
            Description
          </label>
          <button
            type="button"
            onClick={onAiDescriptionAction}
            disabled={descLoading || !formData.title}
            className="flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-[#1a1a1a] disabled:text-[#8a8280] disabled:cursor-not-allowed transition-colors"
          >
            {descLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <PenLine className="w-3 h-3" />
            )}
            {descLoading ? "Writing..." : "Write with AI"}
            {!descLoading && (
              <span className="text-[9px] bg-[#f0eeeb] text-[#6b6560] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] ml-1">
                Beta
              </span>
            )}
          </button>
        </div>
        <textarea
          className={`${INPUT_CLASSES} h-32 resize-none`}
          placeholder="Describe your item — or click 'Write with AI' to generate a description..."
          value={formData.description}
          onChange={(e) => onUpdateAction("description", e.target.value)}
        />
      </div>

      {/* Vehicle-specific attributes */}
      {isVehicle && (
        <div className="bg-[#faf9f7] p-6 border border-[#e8e6e3] space-y-5">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#6b6560]" />
            <span
              className="font-light text-[#1a1a1a] text-base"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Vehicle Details
            </span>
          </div>

          {/* Row 1: Make, Model, Year */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Make
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. Toyota"
                value={vehicleAttrs.make}
                onChange={(e) => onVehicleAttrUpdateAction("make", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Model
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. Corolla"
                value={vehicleAttrs.model}
                onChange={(e) => onVehicleAttrUpdateAction("model", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Year
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 2020"
                value={vehicleAttrs.year}
                onChange={(e) => onVehicleAttrUpdateAction("year", e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Mileage, Fuel Type, Transmission */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Mileage (km)
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 45000"
                value={vehicleAttrs.mileage}
                onChange={(e) => onVehicleAttrUpdateAction("mileage", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Fuel Type
              </label>
              <select
                className={VEHICLE_INPUT_CLASSES}
                value={vehicleAttrs.fuel_type}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("fuel_type", e.target.value)
                }
              >
                <option value="">Select</option>
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {capitalize(ft)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Transmission
              </label>
              <select
                className={VEHICLE_INPUT_CLASSES}
                value={vehicleAttrs.transmission}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("transmission", e.target.value)
                }
              >
                <option value="">Select</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {capitalize(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Color, Body Type, Engine Size */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Color
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. Black"
                value={vehicleAttrs.color}
                onChange={(e) => onVehicleAttrUpdateAction("color", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Body Type
              </label>
              <select
                className={VEHICLE_INPUT_CLASSES}
                value={vehicleAttrs.body_type}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("body_type", e.target.value)
                }
              >
                <option value="">Select</option>
                {BODY_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {capitalize(bt)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Engine (L)
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 2.0"
                value={vehicleAttrs.engine_size}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("engine_size", e.target.value)
                }
              />
            </div>
          </div>

          {/* Row 4: Doors, Drive Type, Owners, Service History */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Doors
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 4"
                value={vehicleAttrs.doors}
                onChange={(e) => onVehicleAttrUpdateAction("doors", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Drive
              </label>
              <select
                className={VEHICLE_INPUT_CLASSES}
                value={vehicleAttrs.drive_type}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("drive_type", e.target.value)
                }
              >
                <option value="">Select</option>
                {DRIVE_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Owners
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 1"
                value={vehicleAttrs.owners}
                onChange={(e) => onVehicleAttrUpdateAction("owners", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                Service
              </label>
              <select
                className={VEHICLE_INPUT_CLASSES}
                value={vehicleAttrs.service_history}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("service_history", e.target.value)
                }
              >
                <option value="">Select</option>
                {SERVICE_HISTORY.map((sh) => (
                  <option key={sh} value={sh}>
                    {capitalize(sh)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[10px] text-[#8a8280] text-center tracking-wide">
            These details help buyers find your vehicle and improve your listing
            quality
          </p>
        </div>
      )}

      {/* Price with AI pricing guide */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560]">
              Price (&euro;)
            </label>
            <button
              type="button"
              onClick={onAiPricingAction}
              disabled={pricingLoading || !formData.title}
              className="flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-[#1a1a1a] disabled:text-[#8a8280] disabled:cursor-not-allowed transition-colors"
            >
              {pricingLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BarChart3 className="w-3 h-3" />
              )}
              {pricingLoading ? "Analyzing..." : "Get pricing guide"}
              {!pricingLoading && (
                <span className="text-[9px] bg-[#f0eeeb] text-[#6b6560] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] ml-1">
                  Beta
                </span>
              )}
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8280] font-medium">
              &euro;
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => onUpdateAction("price", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
            Condition
          </label>
          <select
            className={INPUT_CLASSES}
            value={formData.condition}
            onChange={(e) => onUpdateAction("condition", e.target.value)}
          >
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="for_parts">For Parts</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
            Location
          </label>
          <select
            className={INPUT_CLASSES}
            value={formData.location_id}
            onChange={(e) => onUpdateAction("location_id", e.target.value)}
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
            Price Type
          </label>
          <select
            className={INPUT_CLASSES}
            value={formData.price_type}
            onChange={(e) => onUpdateAction("price_type", e.target.value)}
          >
            <option value="fixed">Fixed Price</option>
            <option value="negotiable">Negotiable</option>
            <option value="free">Free</option>
            <option value="contact">Contact for Price</option>
          </select>
        </div>
      </div>

      {/* AI Pricing Guide Panel */}
      {pricingData && (
        <div className="bg-[#faf9f7] p-6 border border-[#e8e6e3] space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6b6560]" />
            <span
              className="font-light text-[#1a1a1a] text-base"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              AI Pricing Guide
            </span>
            <span className="text-[9px] bg-[#f0eeeb] text-[#6b6560] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em]">
              Beta
            </span>
            {(pricingData.market?.similar_count ?? 0) > 0 && (
              <span className="text-xs text-[#8a8280] ml-auto">
                Based on {pricingData.market!.similar_count} similar listings
              </span>
            )}
          </div>

          {/* Price suggestions */}
          <div className="grid grid-cols-3 gap-3">
            {/* Quick Sale */}
            <button
              type="button"
              onClick={() => {
                onUpdateAction("price", pricingData.price_low?.toString() || "");
                onSelectPriceKeyAction("low");
              }}
              className={`p-4 text-center transition-all cursor-pointer border ${
                selectedPriceKey === "low"
                  ? "border-[#8E7A6B] bg-white ring-1 ring-[#8E7A6B]"
                  : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
              }`}
            >
              <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1">
                Quick Sale
              </div>
              <div
                className="text-xl font-light text-[#1a1a1a] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &euro;{pricingData.price_low?.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600">
                {selectedPriceKey === "low" ? "Selected" : "Competitive"}
              </div>
            </button>

            {/* Recommended */}
            <button
              type="button"
              onClick={() => {
                onUpdateAction(
                  "price",
                  pricingData.suggested_price?.toString() || "",
                );
                onSelectPriceKeyAction("suggested");
              }}
              className={`p-4 text-center transition-all cursor-pointer border ${
                selectedPriceKey === "suggested" || selectedPriceKey === null
                  ? "border-[#8E7A6B] bg-white ring-1 ring-[#8E7A6B]"
                  : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
              }`}
            >
              <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#1a1a1a] mb-1">
                Recommended
              </div>
              <div
                className="text-xl font-light text-[#1a1a1a] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &euro;{pricingData.suggested_price?.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#6b6560]">
                {selectedPriceKey === "suggested" ? "Selected" : "Fair value"}
              </div>
            </button>

            {/* Premium */}
            <button
              type="button"
              onClick={() => {
                onUpdateAction("price", pricingData.price_high?.toString() || "");
                onSelectPriceKeyAction("high");
              }}
              className={`p-4 text-center transition-all cursor-pointer border ${
                selectedPriceKey === "high"
                  ? "border-[#8E7A6B] bg-white ring-1 ring-[#8E7A6B]"
                  : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
              }`}
            >
              <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1">
                Premium
              </div>
              <div
                className="text-xl font-light text-[#1a1a1a] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &euro;{pricingData.price_high?.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-600">
                {selectedPriceKey === "high" ? "Selected" : "Patient sell"}
              </div>
            </button>
          </div>

          {/* Reasoning */}
          {pricingData.reasoning && (
            <p className="text-xs text-[#666] leading-relaxed">
              {pricingData.reasoning}
            </p>
          )}

          {/* Tips */}
          {pricingData.tips && pricingData.tips.length > 0 && (
            <div className="space-y-1.5">
              {pricingData.tips.map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-2 text-xs text-[#666]"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Selection hint */}
          <p className="text-[10px] text-[#8a8280] text-center tracking-wide">
            {selectedPriceKey
              ? "Price applied — you can change it anytime above"
              : "Click a price above to apply it"}
          </p>
        </div>
      )}

      {/* Phone number */}
      <div>
        <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
          Phone Number{" "}
          <span className="text-[#8a8280] font-normal normal-case tracking-normal text-xs">
            (optional)
          </span>
        </label>
        <input
          type="tel"
          className={INPUT_CLASSES}
          placeholder="+357 99 123456"
          value={formData.contact_phone}
          onChange={(e) => onUpdateAction("contact_phone", e.target.value)}
        />
        <p className="text-xs text-[#8a8280] mt-1.5">
          Add a phone number so buyers can call you directly. Leave blank to
          only use messaging.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackAction}
          className="flex-1 border border-[#e8e6e3] text-[#666] py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#faf9f7] transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={onNextAction}
          className="flex-1 bg-[#8E7A6B] text-white py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-colors flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
