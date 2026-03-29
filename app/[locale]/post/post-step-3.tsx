"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import VideoUpload from "@/app/components/video-upload";
import type { ClientPricing } from "@/lib/stripe";
import type {
  Category,
  FormData,
  Location,
  UploadedImage,
  UploadedVideo,
  VehicleAttributes,
} from "./post-types";

type Props = {
  formData: FormData;
  images: UploadedImage[];
  video: UploadedVideo | null;
  userId: string | null;
  selectedPackage: "free" | "featured" | "urgent";
  loading: boolean;
  categories: Category[];
  locations: Location[];
  isVehicle: boolean;
  vehicleAttrs: VehicleAttributes;
  pricing: ClientPricing;
  onSetPackage: (pkg: "free" | "featured" | "urgent") => void;
  onSetVideo: (v: UploadedVideo | null) => void;
  onBack: () => void;
  onPublish: () => void;
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default function PostStep3({
  formData,
  images,
  video,
  userId,
  selectedPackage,
  loading,
  categories,
  locations,
  isVehicle,
  vehicleAttrs,
  pricing,
  onSetPackage,
  onSetVideo,
  onBack,
  onPublish,
}: Props) {
  const category = categories.find((c) => c.id === formData.category_id);
  const location = locations.find((l) => l.id === formData.location_id);
  const firstImage = images.find((img) => img.preview);

  // Vehicle summary chips
  const vehicleChips: string[] = [];
  if (isVehicle) {
    if (vehicleAttrs.year) vehicleChips.push(vehicleAttrs.year);
    if (vehicleAttrs.mileage)
      vehicleChips.push(`${Number(vehicleAttrs.mileage).toLocaleString()} km`);
    if (vehicleAttrs.fuel_type)
      vehicleChips.push(capitalize(vehicleAttrs.fuel_type));
    if (vehicleAttrs.transmission)
      vehicleChips.push(capitalize(vehicleAttrs.transmission));
    if (vehicleAttrs.engine_size)
      vehicleChips.push(`${vehicleAttrs.engine_size}L`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-3xl font-light text-[#1a1a1a] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Review &amp; Publish
        </h2>
        <p className="text-sm text-[#999]">
          Choose how you want your listing to appear
        </p>
      </div>

      {/* ── Two-column layout: Preview (left) + Options (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN — Live Preview */}
        <div className="lg:sticky lg:top-8 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.15em] uppercase text-[#bbb]">
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </div>

          <div
            className={`relative bg-white border overflow-hidden transition-all duration-300 ${
              selectedPackage === "featured"
                ? "border-amber-300 shadow-sm shadow-amber-100/60"
                : selectedPackage === "urgent"
                  ? "border-red-200 shadow-sm shadow-red-100/40"
                  : "border-[#e8e6e3] shadow-sm"
            }`}
          >
            {/* Image area */}
            <div className="relative aspect-4/3 overflow-hidden bg-[#f0eeeb]">
              {firstImage ? (
                <img
                  src={firstImage.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-[#ccc]" />
                </div>
              )}

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

              {/* Category icon */}
              {category?.slug && (
                <span
                  className={`absolute top-3 right-3 ${getCategoryConfig(category.slug).bg} w-8 h-8 flex items-center justify-center rounded-full shadow-md`}
                >
                  <CategoryIcon slug={category.slug} size={16} />
                </span>
              )}

              {/* Featured badge */}
              {selectedPackage === "featured" && (
                <span className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-medium tracking-[0.15em] uppercase px-3 py-1.5 shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}

              {/* Boost badge */}
              {selectedPackage === "urgent" && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-medium tracking-[0.15em] uppercase px-3 py-1.5 shadow-sm flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Boosted
                </span>
              )}

              {/* Stats overlay */}
              <div className="absolute bottom-2.5 left-3 flex items-center gap-3 text-white/90 text-xs font-medium">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> 0
                </span>
                <span className="flex items-center gap-1">
                  <Camera className="w-3 h-3" />{" "}
                  {images.filter((i) => i.url || i.preview).length}
                </span>
                {video?.url && (
                  <span className="flex items-center gap-1">
                    <Video className="w-3 h-3" /> 1
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">
              <h3 className="font-medium text-[#1a1a1a] text-[15px] leading-snug line-clamp-2 mb-1.5">
                {formData.title || "Your listing title"}
              </h3>

              {/* Vehicle chips */}
              {vehicleChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {vehicleChips.map((chip) => (
                    <span
                      key={chip}
                      className="text-[10px] font-medium bg-[#f0eeeb] text-[#666] px-2 py-0.5"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-1.5 text-[#bbb] text-xs mb-3">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{location?.name || "Cyprus"}</span>
                {formData.condition && (
                  <>
                    <span className="text-[#ddd]">&middot;</span>
                    <span className="shrink-0">
                      {capitalize(formData.condition)}
                    </span>
                  </>
                )}
              </div>

              {/* Description preview */}
              {formData.description && (
                <p className="text-xs text-[#999] line-clamp-2 mb-3 leading-relaxed">
                  {formData.description}
                </p>
              )}

              {/* Price and time */}
              <div className="flex items-center justify-between">
                <span
                  className="text-lg font-light text-[#1a1a1a]"
                  style={formData.price ? { fontFamily: "'Playfair Display', serif" } : undefined}
                >
                  {formData.price
                    ? `\u20AC${Number(formData.price).toLocaleString()}`
                    : "Contact for price"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[#bbb]">
                  <Clock className="w-3 h-3" />
                  Just now
                </span>
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className={`absolute left-0 bottom-0 right-0 h-[2px] ${
                selectedPackage === "featured"
                  ? "bg-amber-400"
                  : selectedPackage === "urgent"
                    ? "bg-red-400"
                    : "bg-[#8E7A6B] scale-x-0"
              }`}
            />
          </div>

          {/* Package visual hint */}
          <p className="text-center text-[11px] text-[#bbb] mt-1 min-h-[1rem]">
            {selectedPackage === "featured"
              ? "Your listing will appear at the top of search results with a golden highlight"
              : selectedPackage === "urgent"
                ? "Your listing will stand out with a boost badge and priority placement"
                : "Standard appearance — visible in search results for 30 days"}
          </p>
        </div>

        {/* RIGHT COLUMN — Package Selection + Actions */}
        <div className="space-y-4">
          {/* Free tier */}
          <button
            type="button"
            onClick={() => onSetPackage("free")}
            className={`w-full text-left border p-5 transition-all ${
              selectedPackage === "free"
                ? "border-[#8E7A6B] bg-[#faf9f7] ring-1 ring-[#8E7A6B]"
                : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPackage === "free"
                      ? "border-[#8E7A6B] bg-[#8E7A6B]"
                      : "border-[#e8e6e3]"
                  }`}
                >
                  {selectedPackage === "free" && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-[#1a1a1a] text-sm">
                    Free Listing
                  </div>
                  <div className="text-xs text-[#999]">
                    Standard visibility for 30 days
                  </div>
                </div>
              </div>
              <div
                className="font-light text-[#1a1a1a] shrink-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Free
              </div>
            </div>
          </button>

          {/* Featured tier */}
          <button
            type="button"
            onClick={() => onSetPackage("featured")}
            className={`w-full text-left border p-5 transition-all relative ${
              selectedPackage === "featured"
                ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-400"
                : "border-amber-200 bg-amber-50/20 hover:border-amber-300"
            }`}
          >
            <div className="absolute -top-2.5 right-4 bg-[#8E7A6B] text-white text-[9px] font-medium tracking-[0.15em] uppercase px-3 py-0.5">
              Popular
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPackage === "featured"
                      ? "border-amber-500 bg-amber-500"
                      : "border-amber-300"
                  }`}
                >
                  {selectedPackage === "featured" && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-[#1a1a1a] text-sm">
                    Featured Listing
                  </div>
                  <div className="text-xs text-[#999]">
                    Top placement + highlighted badge for 7 days — up to 5x more views
                  </div>
                </div>
              </div>
              <div
                className="font-light text-amber-700 shrink-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {pricing.featured.price}
              </div>
            </div>
          </button>

          {/* Urgent tier */}
          <button
            type="button"
            onClick={() => onSetPackage("urgent")}
            className={`w-full text-left border p-5 transition-all ${
              selectedPackage === "urgent"
                ? "border-red-300 bg-red-50/40 ring-1 ring-red-300"
                : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPackage === "urgent"
                      ? "border-red-500 bg-red-500"
                      : "border-[#e8e6e3]"
                  }`}
                >
                  {selectedPackage === "urgent" && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-[#1a1a1a] text-sm">
                    Quick Boost
                  </div>
                  <div className="text-xs text-[#999]">
                    Boosted visibility + priority in search for 3 days — up to 3x more views
                  </div>
                </div>
              </div>
              <div
                className="font-light text-red-700 shrink-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {pricing.urgent.price}
              </div>
            </div>
          </button>

          {/* Video Tour — paid tiers only */}
          {selectedPackage !== "free" && userId && (
            <div className="border border-[#e8e6e3] bg-[#faf9f7] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1a1a1a] text-sm">
                    Video Tour
                  </p>
                  <p className="text-xs text-[#999] mt-0.5">
                    Add a short video — included with your paid listing
                  </p>
                </div>
                <span className="text-[9px] font-medium bg-[#8E7A6B] text-white tracking-[0.15em] uppercase px-2.5 py-0.5">
                  Included
                </span>
              </div>
              <VideoUpload
                userId={userId}
                video={video}
                onChangeAction={onSetVideo}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 border border-[#e8e6e3] text-[#666] py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#faf9f7] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={loading}
              className={`flex-[2] py-3.5 text-xs font-medium tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                selectedPackage === "free"
                  ? "bg-[#8E7A6B] text-white hover:bg-[#7A6657]"
                  : selectedPackage === "featured"
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : selectedPackage === "free" ? (
                "Publish Listing"
              ) : selectedPackage === "featured" ? (
                `Publish & Feature — ${pricing.featured.price}`
              ) : (
                `Publish & Boost — ${pricing.urgent.price}`
              )}
            </button>
          </div>

          {selectedPackage !== "free" && (
            <p className="text-center text-xs text-[#bbb]">
              Your listing will be published, then pay to activate your
              promotion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
