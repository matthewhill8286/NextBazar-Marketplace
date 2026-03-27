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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Boost Your Listing</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose how you want your listing to appear
        </p>
      </div>

      {/* ── Two-column layout: Preview (left) + Options (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT COLUMN — Live Preview ═══ */}
        <div className="lg:sticky lg:top-8 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </div>

          <div
            className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
              selectedPackage === "featured"
                ? "border-amber-300 shadow-sm shadow-amber-100/60 ring-1 ring-amber-200"
                : selectedPackage === "urgent"
                  ? "border-red-200 shadow-sm shadow-red-100/40 ring-1 ring-red-100"
                  : "border-gray-200 shadow-sm"
            }`}
          >
            {/* Image area */}
            <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
              {firstImage ? (
                <img
                  src={firstImage.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-gray-300" />
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
                <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}

              {/* Boost badge */}
              {selectedPackage === "urgent" && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
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
              <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2 mb-1.5">
                {formData.title || "Your listing title"}
              </h3>

              {/* Vehicle chips */}
              {vehicleChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {vehicleChips.map((chip) => (
                    <span
                      key={chip}
                      className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{location?.name || "Cyprus"}</span>
                {formData.condition && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="shrink-0">
                      {capitalize(formData.condition)}
                    </span>
                  </>
                )}
              </div>

              {/* Description preview */}
              {formData.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                  {formData.description}
                </p>
              )}

              {/* Price and time */}
              <div className="flex items-center justify-between">
                <span
                  className={`font-extrabold ${formData.price ? "text-gray-900 text-lg" : "text-gray-500 text-sm"}`}
                >
                  {formData.price
                    ? `€${Number(formData.price).toLocaleString()}`
                    : "Contact for price"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  Just now
                </span>
              </div>
            </div>

            {/* Accent stripe */}
            {selectedPackage === "featured" && (
              <div className="absolute left-0 bottom-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
            )}
            {selectedPackage === "urgent" && (
              <div className="absolute left-0 bottom-0 right-0 h-1 bg-gradient-to-r from-red-400 via-rose-400 to-red-400" />
            )}
          </div>

          {/* Package visual hint */}
          <p className="text-center text-[11px] text-gray-400 mt-1 min-h-[1rem]">
            {selectedPackage === "featured"
              ? "Your listing will appear at the top of search results with a golden highlight"
              : selectedPackage === "urgent"
                ? "Your listing will stand out with a boost badge and priority placement"
                : "Standard appearance — visible in search results for 30 days"}
          </p>
        </div>

        {/* ═══ RIGHT COLUMN — Package Selection + Actions ═══ */}
        <div className="space-y-4">
          {/* Free tier */}
          <button
            type="button"
            onClick={() => onSetPackage("free")}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              selectedPackage === "free"
                ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPackage === "free"
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPackage === "free" && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Free Listing
                  </div>
                  <div className="text-xs text-gray-500">
                    Standard visibility for 30 days
                  </div>
                </div>
              </div>
              <div className="font-bold text-gray-900 shrink-0">Free</div>
            </div>
          </button>

          {/* Featured tier */}
          <button
            type="button"
            onClick={() => onSetPackage("featured")}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all relative ${
              selectedPackage === "featured"
                ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-100"
                : "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 hover:border-amber-400"
            }`}
          >
            <div className="absolute -top-2.5 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              POPULAR
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
                  <div className="font-semibold text-gray-900 text-sm">
                    Featured Listing
                  </div>
                  <div className="text-xs text-gray-500">
                    Top placement + highlighted badge for 7 days · Up to 5× more
                    views
                  </div>
                </div>
              </div>
              <div className="font-bold text-amber-600 shrink-0">
                {pricing.featured.price}
              </div>
            </div>
          </button>

          {/* Urgent tier */}
          <button
            type="button"
            onClick={() => onSetPackage("urgent")}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              selectedPackage === "urgent"
                ? "border-red-400 bg-red-50/50 ring-2 ring-red-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPackage === "urgent"
                      ? "border-red-500 bg-red-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPackage === "urgent" && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Quick Boost
                  </div>
                  <div className="text-xs text-gray-500">
                    Boosted visibility + priority in search for 3 days · Up to
                    3× more views
                  </div>
                </div>
              </div>
              <div className="font-bold text-red-600 shrink-0">
                {pricing.urgent.price}
              </div>
            </div>
          </button>

          {/* Video Tour — paid tiers only */}
          {selectedPackage !== "free" && userId && (
            <div className="rounded-xl border-2 border-violet-200 bg-violet-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Video Tour
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add a short video — included with your paid listing
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">
                  INCLUDED
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
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={loading}
              className={`flex-[2] py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                selectedPackage === "free"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : selectedPackage === "featured"
                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200"
                    : "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200"
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
            <p className="text-center text-xs text-gray-400">
              Your listing will be published, then pay to activate your
              promotion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
