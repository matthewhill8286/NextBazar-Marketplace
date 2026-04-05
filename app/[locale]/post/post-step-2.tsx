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
import { useTranslations } from "next-intl";
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
    | "quantity"
    | "low_stock_threshold"
  >;
  locations: Location[];
  pricingData: PricingData | null;
  pricingLoading: boolean;
  selectedPriceKey: "low" | "suggested" | "high" | null;
  descLoading: boolean;
  canUseAiDescriptions: boolean;
  isVehicle: boolean;
  vehicleAttrs: VehicleAttributes;
  onUpdateAction: (key: string, value: string) => void;
  onSelectPriceKeyAction: (key: "low" | "suggested" | "high") => void;
  onAiDescriptionAction: () => void;
  onAiPricingAction: () => void;
  onVehicleAttrUpdateAction: (
    key: keyof VehicleAttributes,
    value: string,
  ) => void;
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
  canUseAiDescriptions,
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
  const t = useTranslations("post");
  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-3xl font-light text-[#1a1a1a] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("step2.heading")}
        </h2>
        <p className="text-sm text-[#6b6560]">{t("step2.subheading")}</p>
      </div>

      {/* Description with AI writer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560]">
            {t("step2.descriptionLabel")}
          </label>
          {canUseAiDescriptions ? (
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
              {descLoading ? t("step2.writing") : t("step2.writeWithAi")}
              {!descLoading && (
                <span className="text-[9px] bg-[#f0eeeb] text-[#6b6560] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] ml-1">
                  Beta
                </span>
              )}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-[#8a8280]">
              <PenLine className="w-3 h-3" />
              {t("step2.writeWithAi")}
              <span className="text-[9px] bg-[#f0eeeb] text-[#8a8280] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] ml-1">
                Business
              </span>
            </span>
          )}
        </div>
        <textarea
          className={`${INPUT_CLASSES} h-32 resize-none`}
          placeholder={t("step2.descriptionPlaceholder")}
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
              {t("step2.vehicleDetails")}
            </span>
          </div>

          {/* Row 1: Make, Model, Year */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.make")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. Toyota"
                value={vehicleAttrs.make}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("make", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.model")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. Corolla"
                value={vehicleAttrs.model}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("model", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.year")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 2020"
                value={vehicleAttrs.year}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("year", e.target.value)
                }
              />
            </div>
          </div>

          {/* Row 2: Mileage, Fuel Type, Transmission */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.mileage")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 45000"
                value={vehicleAttrs.mileage}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("mileage", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.fuelType")}
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
                    {t(`vehicle.${ft}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.transmission")}
              </label>
              <select
                className={VEHICLE_INPUT_CLASSES}
                value={vehicleAttrs.transmission}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("transmission", e.target.value)
                }
              >
                <option value="">Select</option>
                {TRANSMISSIONS.map((tr) => (
                  <option key={tr} value={tr}>
                    {t(`vehicle.${tr}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Color, Body Type, Engine Size */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.color")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. Black"
                value={vehicleAttrs.color}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("color", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.bodyType")}
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
                    {t(`vehicle.${bt}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.engine")}
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
                {t("step2.doors")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 4"
                value={vehicleAttrs.doors}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("doors", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.drive")}
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
                    {t(`vehicle.${dt.value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.owners")}
              </label>
              <input
                type="text"
                className={VEHICLE_INPUT_CLASSES}
                placeholder="e.g. 1"
                value={vehicleAttrs.owners}
                onChange={(e) =>
                  onVehicleAttrUpdateAction("owners", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5">
                {t("step2.service")}
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
                    {t(`vehicle.${sh}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[10px] text-[#8a8280] text-center tracking-wide">
            {t("step2.vehicleDetailsHint")}
          </p>
        </div>
      )}

      {/* Price with AI pricing guide */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560]">
              {t("step2.priceLabel")}
            </label>
            {canUseAiDescriptions ? (
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
                {pricingLoading
                  ? t("step2.analyzing")
                  : t("step2.getPricingGuide")}
                {!pricingLoading && (
                  <span className="text-[9px] bg-[#f0eeeb] text-[#6b6560] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] ml-1">
                    Beta
                  </span>
                )}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-[#8a8280]">
                <BarChart3 className="w-3 h-3" />
                {t("step2.getPricingGuide")}
                <span className="text-[9px] bg-[#f0eeeb] text-[#8a8280] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] ml-1">
                  Business
                </span>
              </span>
            )}
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
            {t("step2.conditionLabel")}
          </label>
          <select
            className={INPUT_CLASSES}
            value={formData.condition}
            onChange={(e) => onUpdateAction("condition", e.target.value)}
          >
            <option value="new">{t("step2.conditionNew")}</option>
            <option value="like_new">{t("step2.conditionLikeNew")}</option>
            <option value="good">{t("step2.conditionGood")}</option>
            <option value="fair">{t("step2.conditionFair")}</option>
            <option value="for_parts">{t("step2.conditionForParts")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
            {t("step2.locationLabel")}
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
            {t("step2.priceTypeLabel")}
          </label>
          <select
            className={INPUT_CLASSES}
            value={formData.price_type}
            onChange={(e) => onUpdateAction("price_type", e.target.value)}
          >
            <option value="fixed">{t("step2.priceTypeFixed")}</option>
            <option value="negotiable">{t("step2.priceTypeNegotiable")}</option>
            <option value="free">{t("step2.priceTypeFree")}</option>
            <option value="contact">{t("step2.priceTypeContact")}</option>
          </select>
        </div>
      </div>

      {/* Stock / Quantity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
            Quantity in stock
          </label>
          <input
            type="number"
            min="0"
            className={INPUT_CLASSES}
            placeholder="Leave empty for single item"
            value={formData.quantity}
            onChange={(e) => onUpdateAction("quantity", e.target.value)}
          />
          <p className="text-[10px] text-[#8a8280] mt-1">
            Optional — track stock for items you sell multiple of
          </p>
        </div>
        {formData.quantity && Number(formData.quantity) > 0 && (
          <div>
            <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
              Low stock alert at
            </label>
            <input
              type="number"
              min="1"
              className={INPUT_CLASSES}
              value={formData.low_stock_threshold}
              onChange={(e) =>
                onUpdateAction("low_stock_threshold", e.target.value)
              }
            />
            <p className="text-[10px] text-[#8a8280] mt-1">
              Get notified when stock drops to this level
            </p>
          </div>
        )}
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
              {t("step2.aiPricingGuide")}
            </span>
            <span className="text-[9px] bg-[#f0eeeb] text-[#6b6560] px-1.5 py-0.5 font-medium uppercase tracking-[0.1em]">
              Beta
            </span>
            {(pricingData.market?.similar_count ?? 0) > 0 && (
              <span className="text-xs text-[#8a8280] ml-auto">
                {t("step2.basedOn", {
                  count: pricingData.market!.similar_count,
                })}
              </span>
            )}
          </div>

          {/* Price suggestions */}
          <div className="grid grid-cols-3 gap-3">
            {/* Quick Sale */}
            <button
              type="button"
              onClick={() => {
                onUpdateAction(
                  "price",
                  pricingData.price_low?.toString() || "",
                );
                onSelectPriceKeyAction("low");
              }}
              className={`p-4 text-center transition-all cursor-pointer border ${
                selectedPriceKey === "low"
                  ? "border-[#8E7A6B] bg-white ring-1 ring-[#8E7A6B]"
                  : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
              }`}
            >
              <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1">
                {t("step2.quickSale")}
              </div>
              <div
                className="text-xl font-light text-[#1a1a1a] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &euro;{pricingData.price_low?.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600">
                {selectedPriceKey === "low"
                  ? t("step2.selected")
                  : t("step2.competitive")}
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
                {t("step2.recommended")}
              </div>
              <div
                className="text-xl font-light text-[#1a1a1a] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &euro;{pricingData.suggested_price?.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#6b6560]">
                {selectedPriceKey === "suggested"
                  ? t("step2.selected")
                  : t("step2.fairValue")}
              </div>
            </button>

            {/* Premium */}
            <button
              type="button"
              onClick={() => {
                onUpdateAction(
                  "price",
                  pricingData.price_high?.toString() || "",
                );
                onSelectPriceKeyAction("high");
              }}
              className={`p-4 text-center transition-all cursor-pointer border ${
                selectedPriceKey === "high"
                  ? "border-[#8E7A6B] bg-white ring-1 ring-[#8E7A6B]"
                  : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
              }`}
            >
              <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1">
                {t("step2.premium")}
              </div>
              <div
                className="text-xl font-light text-[#1a1a1a] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &euro;{pricingData.price_high?.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-600">
                {selectedPriceKey === "high"
                  ? t("step2.selected")
                  : t("step2.patientSell")}
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
            {selectedPriceKey ? t("step2.priceApplied") : t("step2.clickPrice")}
          </p>
        </div>
      )}

      {/* Phone number */}
      <div>
        <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
          {t("step2.phoneNumberLabel")}{" "}
          <span className="text-[#8a8280] font-normal normal-case tracking-normal text-xs">
            {t("step2.phoneNumberOptional")}
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
          {t("step2.phoneNumberHint")}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackAction}
          className="flex-1 border border-[#e8e6e3] text-[#666] py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#faf9f7] transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t("step2.back")}
        </button>
        <button
          type="button"
          onClick={onNextAction}
          className="flex-1 bg-[#8E7A6B] text-white py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-colors flex items-center justify-center gap-2"
        >
          {t("step2.continue")} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
