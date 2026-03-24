"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Lightbulb,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { FormData, Location, PricingData } from "./post-types";

type Props = {
  formData: Pick<
    FormData,
    "title" | "price" | "price_type" | "description" | "condition" | "location_id" | "contact_phone"
  >;
  locations: Location[];
  pricingData: PricingData | null;
  pricingLoading: boolean;
  selectedPriceKey: "low" | "suggested" | "high" | null;
  descLoading: boolean;
  onUpdate: (key: string, value: string) => void;
  onSelectPriceKey: (key: "low" | "suggested" | "high") => void;
  onAiDescription: () => void;
  onAiPricing: () => void;
  onBack: () => void;
  onNext: () => void;
};

export default function PostStep2({
  formData,
  locations,
  pricingData,
  pricingLoading,
  selectedPriceKey,
  descLoading,
  onUpdate,
  onSelectPriceKey,
  onAiDescription,
  onAiPricing,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Details &amp; Pricing
      </h2>

      {/* Description with AI writer */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <button
            type="button"
            onClick={onAiDescription}
            disabled={descLoading || !formData.title}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {descLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <PenLine className="w-3 h-3" />
            )}
            {descLoading ? "Writing..." : "Write with AI"}
          </button>
        </div>
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm h-32 resize-none"
          placeholder="Describe your item — or click 'Write with AI' to generate a description..."
          value={formData.description}
          onChange={(e) => onUpdate("description", e.target.value)}
        />
      </div>

      {/* Price with AI pricing guide */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Price (€)
            </label>
            <button
              type="button"
              onClick={onAiPricing}
              disabled={pricingLoading || !formData.title}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {pricingLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BarChart3 className="w-3 h-3" />
              )}
              {pricingLoading ? "Analyzing..." : "Get pricing guide"}
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              €
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => onUpdate("price", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Condition
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
            value={formData.condition}
            onChange={(e) => onUpdate("condition", e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
            value={formData.location_id}
            onChange={(e) => onUpdate("location_id", e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Price Type
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
            value={formData.price_type}
            onChange={(e) => onUpdate("price_type", e.target.value)}
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
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-indigo-900 text-sm">
              AI Pricing Guide
            </span>
            {(pricingData.market?.similar_count ?? 0) > 0 && (
              <span className="text-xs text-indigo-400 ml-auto">
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
                onUpdate("price", pricingData.price_low?.toString() || "");
                onSelectPriceKey("low");
              }}
              className={`rounded-lg p-3 text-center transition-all cursor-pointer ${
                selectedPriceKey === "low"
                  ? "bg-green-50 ring-2 ring-green-400 shadow-sm shadow-green-100"
                  : "bg-white/80 hover:ring-2 hover:ring-indigo-200"
              }`}
            >
              <div className={`text-[10px] font-medium mb-0.5 ${selectedPriceKey === "low" ? "text-green-700" : "text-gray-500"}`}>
                Quick Sale
              </div>
              <div className="text-lg font-bold text-gray-900">
                €{pricingData.price_low?.toLocaleString()}
              </div>
              <div className={`text-[10px] ${selectedPriceKey === "low" ? "text-green-700 font-semibold" : "text-green-600"}`}>
                {selectedPriceKey === "low" ? "✓ Selected" : "Competitive"}
              </div>
            </button>

            {/* Recommended */}
            <button
              type="button"
              onClick={() => {
                onUpdate("price", pricingData.suggested_price?.toString() || "");
                onSelectPriceKey("suggested");
              }}
              className={`rounded-lg p-3 text-center transition-all cursor-pointer ${
                selectedPriceKey === "suggested" || selectedPriceKey === null
                  ? "bg-white ring-2 ring-indigo-400 shadow-sm shadow-indigo-100"
                  : "bg-white/80 ring-2 ring-indigo-200"
              }`}
            >
              <div className="text-[10px] text-indigo-600 font-semibold mb-0.5">
                Recommended
              </div>
              <div className="text-lg font-bold text-gray-900">
                €{pricingData.suggested_price?.toLocaleString()}
              </div>
              <div className="text-[10px] text-indigo-600">
                {selectedPriceKey === "suggested" ? "✓ Selected" : "Fair value"}
              </div>
            </button>

            {/* Premium */}
            <button
              type="button"
              onClick={() => {
                onUpdate("price", pricingData.price_high?.toString() || "");
                onSelectPriceKey("high");
              }}
              className={`rounded-lg p-3 text-center transition-all cursor-pointer ${
                selectedPriceKey === "high"
                  ? "bg-amber-50 ring-2 ring-amber-400 shadow-sm shadow-amber-100"
                  : "bg-white/80 hover:ring-2 hover:ring-indigo-200"
              }`}
            >
              <div className={`text-[10px] font-medium mb-0.5 ${selectedPriceKey === "high" ? "text-amber-700" : "text-gray-500"}`}>
                Premium
              </div>
              <div className="text-lg font-bold text-gray-900">
                €{pricingData.price_high?.toLocaleString()}
              </div>
              <div className={`text-[10px] ${selectedPriceKey === "high" ? "text-amber-700 font-semibold" : "text-amber-600"}`}>
                {selectedPriceKey === "high" ? "✓ Selected" : "Patient sell"}
              </div>
            </button>
          </div>

          {/* Reasoning */}
          {pricingData.reasoning && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {pricingData.reasoning}
            </p>
          )}

          {/* Tips */}
          {pricingData.tips && pricingData.tips.length > 0 && (
            <div className="space-y-1.5">
              {pricingData.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-indigo-700"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Selection hint */}
          <p className="text-[10px] text-indigo-400 text-center">
            {selectedPriceKey
              ? "Price applied — you can change it anytime above"
              : "Click a price above to apply it"}
          </p>
        </div>
      )}

      {/* Phone number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Phone Number{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          placeholder="+357 99 123456"
          value={formData.contact_phone}
          onChange={(e) => onUpdate("contact_phone", e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">
          Add a phone number so buyers can call you directly. Leave blank to
          only use messaging.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
