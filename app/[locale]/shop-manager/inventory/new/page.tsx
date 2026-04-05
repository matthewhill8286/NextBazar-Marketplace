"use client";

import {
  ArrowLeft,
  BarChart3,
  Car,
  Lightbulb,
  Loader2,
  Package,
  PenLine,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UploadedImage } from "@/app/components/image-upload";
import ImageUpload from "@/app/components/image-upload";
import type { UploadedVideo } from "@/app/components/video-upload";
import VideoUpload from "@/app/components/video-upload";
import { Link, useRouter } from "@/i18n/navigation";
import { useReferenceData } from "@/lib/hooks/use-reference-data";
import { getPlanLimits } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/client";
import { useShopCMS } from "../../shop-context";

// ─── Vehicle constants ──────────────────────────────────────────────────────
const VEHICLES_CATEGORY_SLUG = "vehicles";

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

type VehicleAttributes = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  color: string;
  body_type: string;
  engine_size: string;
  doors: string;
  drive_type: string;
  owners: string;
  service_history: string;
};

const EMPTY_VEHICLE_ATTRS: VehicleAttributes = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  fuel_type: "",
  transmission: "",
  color: "",
  body_type: "",
  engine_size: "",
  doors: "",
  drive_type: "",
  owners: "",
  service_history: "",
};

type PricingData = {
  price_low?: number;
  suggested_price?: number;
  price_high?: number;
  reasoning?: string;
  tips?: string[];
  market?: { similar_count: number };
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const INPUT =
  "w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm bg-white";
const VEHICLE_INPUT =
  "w-full px-3 py-2.5 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm bg-white";
const LABEL =
  "block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-1.5";

export default function NewInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const { userId, shop, refreshListings } = useShopCMS();
  const { categories, subcategories, locations, loading: refLoading } = useReferenceData();
  const limits = getPlanLimits(shop?.plan_tier || "starter");

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    subcategory_id: "",
    price: "",
    price_type: "fixed",
    description: "",
    condition: "good",
    location_id: "",
    contact_phone: "",
  });

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [vehicleAttrs, setVehicleAttrs] = useState<VehicleAttributes>(EMPTY_VEHICLE_ATTRS);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [selectedPriceKey, setSelectedPriceKey] = useState<"low" | "suggested" | "high" | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillDone, setAutofillDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  const filteredSubs = subcategories.filter((s) => s.category_id === formData.category_id);
  const selectedSub = subcategories.find((s) => s.id === formData.subcategory_id);
  const isParts = selectedSub?.slug === "parts-accessories";
  const isVehicle = selectedCategory?.slug === VEHICLES_CATEGORY_SLUG && !isParts;

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const updateVehicleAttr = (key: keyof VehicleAttributes, value: string) =>
    setVehicleAttrs((prev) => ({ ...prev, [key]: value }));

  const handleImagesChange = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
  }, []);

  // ── AI Autofill from image ────────────────────────────────────────────────
  async function handleAiAutofill() {
    const firstUploaded = images.find((img) => img.url && !img.uploading);
    if (!firstUploaded?.url) {
      toast.error("Upload a photo first so AI can analyze it.");
      return;
    }

    setAutofillLoading(true);
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: firstUploaded.url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze image");
      }
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        category_id: data.category_id || prev.category_id,
        subcategory_id: data.subcategory_id || prev.subcategory_id,
        condition: data.condition || prev.condition,
        price: data.suggested_price ? String(data.suggested_price) : prev.price,
      }));

      // If AI detected vehicle attributes, pre-fill them
      if (data.vehicle_attributes && typeof data.vehicle_attributes === "object") {
        setVehicleAttrs((prev) => {
          const merged = { ...prev };
          for (const [k, v] of Object.entries(data.vehicle_attributes)) {
            if (v && typeof v === "string" && k in prev) {
              (merged as Record<string, string>)[k] = v;
            }
          }
          return merged;
        });
      }

      setAutofillDone(true);
      toast.success("AI auto-filled your listing details!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "AI autofill failed. Try again.",
      );
    }
    setAutofillLoading(false);
  }

  // ── AI Description ────────────────────────────────────────────────────────
  async function handleAiDescription() {
    if (!formData.title) {
      toast.error("Add a title first so AI can generate a description.");
      return;
    }
    setDescLoading(true);
    try {
      const firstImage = images.find((img) => img.url && !img.uploading);
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: selectedCategory?.name,
          condition: formData.condition,
          price: formData.price || null,
          imageUrl: firstImage?.url || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate description");
      }
      const data = await res.json();
      if (data.description) {
        update("description", data.description);
        toast.success("AI description generated!");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "AI description failed. Try again.",
      );
    }
    setDescLoading(false);
  }

  // ── AI Pricing ────────────────────────────────────────────────────────────
  async function handleAiPricing() {
    if (!formData.title) {
      toast.error("Add a title first so AI can suggest a price.");
      return;
    }
    setPricingLoading(true);
    setPricingData(null);
    setSelectedPriceKey(null);
    try {
      const res = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          categoryId: formData.category_id || null,
          condition: formData.condition,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate pricing");
      }
      const data = await res.json();
      setPricingData(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "AI pricing failed. Try again.",
      );
    }
    setPricingLoading(false);
  }

  // ── Save as draft ─────────────────────────────────────────────────────────
  async function handleSave(status: "draft" | "active") {
    setSaving(true);

    if (!formData.title.trim()) {
      toast.error("Please enter a title.");
      setSaving(false);
      return;
    }
    if (!formData.category_id) {
      toast.error("Please select a category.");
      setSaving(false);
      return;
    }
    if (!formData.subcategory_id) {
      toast.error("Please select a subcategory.");
      setSaving(false);
      return;
    }

    const pendingUploads = images.some((img) => img.uploading);
    if (pendingUploads) {
      toast.error("Please wait for all images to finish uploading.");
      setSaving(false);
      return;
    }
    if (video?.uploading) {
      toast.error("Please wait for your video to finish uploading.");
      setSaving(false);
      return;
    }

    const uploadedUrls = images.filter((img) => img.url).map((img) => img.url!);

    // Build vehicle attributes JSON if applicable
    const hasVehicleData =
      isVehicle && Object.values(vehicleAttrs).some((v) => v.trim() !== "");
    const attributes = hasVehicleData ? vehicleAttrs : null;

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        user_id: userId,
        title: formData.title.trim(),
        slug: "", // auto-generated by trigger
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        location_id: formData.location_id || null,
        description: formData.description || null,
        price: formData.price ? Number(formData.price) : null,
        price_type: formData.price_type,
        condition: formData.condition || null,
        contact_phone: formData.contact_phone || null,
        status,
        primary_image_url: uploadedUrls[0] || null,
        image_count: uploadedUrls.length,
        video_url: video?.url || null,
        ...(attributes ? { attributes } : {}),
      })
      .select("id, slug")
      .single();

    if (insertError) {
      toast.error(insertError.message);
      setSaving(false);
      return;
    }

    // Insert image records
    if (uploadedUrls.length > 0) {
      const imageRecords = uploadedUrls.map((url, idx) => ({
        listing_id: data.id,
        url,
        sort_order: idx,
      }));
      await supabase.from("listing_images").insert(imageRecords);
    }

    await refreshListings();
    toast.success(
      status === "draft"
        ? "Listing saved as draft"
        : "Listing is now active!",
    );
    setSaving(false);
    router.push("/shop-manager/inventory");
  }

  if (refLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-[#8a8280]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/shop-manager/inventory"
          className="p-2 hover:bg-[#f0eeeb] transition-colors text-[#6b6560]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Add Inventory</h1>
          <p className="text-xs text-[#8a8280] mt-0.5">
            Create a new listing for your shop
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#e8e6e3] p-6 space-y-6">
        {/* ── Images ───────────────────────────────────────────────────────── */}
        <ImageUpload
          userId={userId}
          images={images}
          maxImages={limits.imagesPerListing}
          onChangeAction={handleImagesChange}
        />

        {/* ── AI Autofill button ─────────────────────────────────────────── */}
        {images.some((img) => img.url && !img.uploading) && !autofillDone && (
          <button
            type="button"
            onClick={handleAiAutofill}
            disabled={autofillLoading}
            className="w-full bg-[#8E7A6B] text-white py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {autofillLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your photo…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-fill details from photo
                <span className="text-[9px] bg-white/20 px-2 py-0.5 font-medium uppercase tracking-[0.15em]">
                  Beta
                </span>
              </>
            )}
          </button>
        )}
        {autofillDone && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-2.5 border border-emerald-100">
            <Sparkles className="w-4 h-4" />
            AI filled in details — review and adjust as needed
          </div>
        )}

        {/* ── Video ────────────────────────────────────────────────────────── */}
        <div className="border-2 border-[#e8e6e3] bg-[#f0eeeb]/50 p-5 space-y-3">
          <div>
            <p className="font-semibold text-[#1a1a1a] text-sm">
              Video Tour
            </p>
            <p className="text-xs text-[#6b6560] mt-0.5">
              Add a short video walkthrough of your item
            </p>
          </div>
          <VideoUpload
            userId={userId}
            video={video}
            onChangeAction={setVideo}
          />
        </div>

        {/* ── Title ────────────────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Title</label>
          <input
            type="text"
            className={INPUT}
            placeholder="e.g. 2023 Tesla Model 3 Long Range"
            value={formData.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        {/* ── Category & Subcategory ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Category</label>
            <select
              className={INPUT}
              value={formData.category_id}
              onChange={(e) => {
                update("category_id", e.target.value);
                update("subcategory_id", "");
                setVehicleAttrs(EMPTY_VEHICLE_ATTRS);
              }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Subcategory</label>
            <select
              className={INPUT}
              value={formData.subcategory_id}
              onChange={(e) => update("subcategory_id", e.target.value)}
              disabled={!formData.category_id}
            >
              <option value="">Select subcategory</option>
              {filteredSubs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Description with AI writer ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={LABEL}>Description</label>
            <button
              type="button"
              onClick={() => {
                if (!formData.title) {
                  toast.error("Add a title first so AI can generate a description.");
                  return;
                }
                handleAiDescription();
              }}
              disabled={descLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657] disabled:text-[#8a8280] disabled:cursor-not-allowed transition-colors"
            >
              {descLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {descLoading ? "Writing..." : "Write with AI"}
            </button>
          </div>
          <textarea
            className={`${INPUT} h-32 resize-none`}
            placeholder="Describe your item — or click 'Write with AI' to generate a description..."
            value={formData.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        {/* ── Vehicle-specific attributes ──────────────────────────────────── */}
        {isVehicle && (
          <div className="bg-[#faf9f7] p-6 border border-[#e8e6e3] space-y-5">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#6b6560]" />
              <span className="font-semibold text-[#1a1a1a] text-sm">
                Vehicle Details
              </span>
            </div>

            {/* Row 1: Make, Model, Year */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Make</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. Toyota"
                  value={vehicleAttrs.make}
                  onChange={(e) => updateVehicleAttr("make", e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Model</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. Corolla"
                  value={vehicleAttrs.model}
                  onChange={(e) => updateVehicleAttr("model", e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Year</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. 2020"
                  value={vehicleAttrs.year}
                  onChange={(e) => updateVehicleAttr("year", e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Mileage, Fuel Type, Transmission */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Mileage</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. 45000"
                  value={vehicleAttrs.mileage}
                  onChange={(e) => updateVehicleAttr("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Fuel Type</label>
                <select
                  className={VEHICLE_INPUT}
                  value={vehicleAttrs.fuel_type}
                  onChange={(e) => updateVehicleAttr("fuel_type", e.target.value)}
                >
                  <option value="">Select</option>
                  {FUEL_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft.charAt(0).toUpperCase() + ft.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Transmission</label>
                <select
                  className={VEHICLE_INPUT}
                  value={vehicleAttrs.transmission}
                  onChange={(e) => updateVehicleAttr("transmission", e.target.value)}
                >
                  <option value="">Select</option>
                  {TRANSMISSIONS.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr.charAt(0).toUpperCase() + tr.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Color, Body Type, Engine Size */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Color</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. Black"
                  value={vehicleAttrs.color}
                  onChange={(e) => updateVehicleAttr("color", e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Body Type</label>
                <select
                  className={VEHICLE_INPUT}
                  value={vehicleAttrs.body_type}
                  onChange={(e) => updateVehicleAttr("body_type", e.target.value)}
                >
                  <option value="">Select</option>
                  {BODY_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt.charAt(0).toUpperCase() + bt.slice(1).replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Engine (L)</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. 2.0"
                  value={vehicleAttrs.engine_size}
                  onChange={(e) => updateVehicleAttr("engine_size", e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Doors, Drive Type, Owners, Service History */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={LABEL}>Doors</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. 4"
                  value={vehicleAttrs.doors}
                  onChange={(e) => updateVehicleAttr("doors", e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Drive</label>
                <select
                  className={VEHICLE_INPUT}
                  value={vehicleAttrs.drive_type}
                  onChange={(e) => updateVehicleAttr("drive_type", e.target.value)}
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
                <label className={LABEL}>Owners</label>
                <input
                  type="text"
                  className={VEHICLE_INPUT}
                  placeholder="e.g. 1"
                  value={vehicleAttrs.owners}
                  onChange={(e) => updateVehicleAttr("owners", e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Service</label>
                <select
                  className={VEHICLE_INPUT}
                  value={vehicleAttrs.service_history}
                  onChange={(e) => updateVehicleAttr("service_history", e.target.value)}
                >
                  <option value="">Select</option>
                  {SERVICE_HISTORY.map((sh) => (
                    <option key={sh} value={sh}>
                      {sh.charAt(0).toUpperCase() + sh.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Price with AI pricing guide ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={LABEL}>Price</label>
              <button
                type="button"
                onClick={() => {
                  if (!formData.title) {
                    toast.error("Add a title first so AI can analyze pricing.");
                    return;
                  }
                  handleAiPricing();
                }}
                disabled={pricingLoading}
                className="flex items-center gap-1.5 text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657] disabled:text-[#8a8280] disabled:cursor-not-allowed transition-colors"
              >
                {pricingLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BarChart3 className="w-3 h-3" />
                )}
                {pricingLoading ? "Analyzing..." : "Get Pricing Guide"}
                {!pricingLoading && (
                  <span className="text-[9px] bg-[#e8e6e3] text-[#7A6657] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ml-1">
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
                className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Price Type</label>
            <select
              className={INPUT}
              value={formData.price_type}
              onChange={(e) => update("price_type", e.target.value)}
            >
              <option value="fixed">Fixed Price</option>
              <option value="negotiable">Negotiable</option>
              <option value="free">Free</option>
              <option value="contact">Contact for Price</option>
            </select>
          </div>
        </div>

        {/* ── AI Pricing Guide Panel ───────────────────────────────────────── */}
        {pricingData && (
          <div className="bg-[#faf9f7] p-6 border border-[#e8e6e3] space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6b6560]" />
              <span className="font-semibold text-[#1a1a1a] text-sm">
                AI Pricing Guide
              </span>
              <span className="text-[9px] bg-[#e8e6e3] text-[#7A6657] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Beta
              </span>
              {(pricingData.market?.similar_count ?? 0) > 0 && (
                <span className="text-xs text-[#8a8280] ml-auto">
                  Based on {pricingData.market!.similar_count} similar listings
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Quick Sale */}
              <button
                type="button"
                onClick={() => {
                  update("price", pricingData.price_low?.toString() || "");
                  setSelectedPriceKey("low");
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
                <div className="text-xl font-bold text-[#1a1a1a] mb-1">
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
                  update("price", pricingData.suggested_price?.toString() || "");
                  setSelectedPriceKey("suggested");
                }}
                className={`p-4 text-center transition-all cursor-pointer border ${
                  selectedPriceKey === "suggested"
                    ? "border-[#8E7A6B] bg-white ring-1 ring-[#8E7A6B]"
                    : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
                }`}
              >
                <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#1a1a1a] mb-1">
                  Recommended
                </div>
                <div className="text-xl font-bold text-[#1a1a1a] mb-1">
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
                  update("price", pricingData.price_high?.toString() || "");
                  setSelectedPriceKey("high");
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
                <div className="text-xl font-bold text-[#1a1a1a] mb-1">
                  &euro;{pricingData.price_high?.toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-600">
                  {selectedPriceKey === "high" ? "Selected" : "Patient sell"}
                </div>
              </button>
            </div>

            {pricingData.reasoning && (
              <p className="text-xs text-[#666] leading-relaxed">
                {pricingData.reasoning}
              </p>
            )}

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
          </div>
        )}

        {/* ── Condition & Location ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Condition</label>
            <select
              className={INPUT}
              value={formData.condition}
              onChange={(e) => update("condition", e.target.value)}
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="for_parts">For Parts</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Location</label>
            <select
              className={INPUT}
              value={formData.location_id}
              onChange={(e) => update("location_id", e.target.value)}
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Phone ────────────────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>
            Phone Number{" "}
            <span className="text-[#8a8280] font-normal normal-case tracking-normal text-xs">
              (optional)
            </span>
          </label>
          <input
            type="tel"
            className={INPUT}
            placeholder="+357 99 123456"
            value={formData.contact_phone}
            onChange={(e) => update("contact_phone", e.target.value)}
          />
          <p className="text-xs text-[#8a8280] mt-1">
            Leave blank to hide the phone button on your listing.
          </p>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#f0eeeb]">
          <button
            onClick={() => handleSave("active")}
            disabled={saving}
            className="bg-[#8E7A6B] text-white px-6 py-3 font-semibold hover:bg-[#7A6657] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-[#8E7A6B]/15"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            Publish
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="border border-[#e8e6e3] text-[#666] px-6 py-3 font-semibold hover:bg-[#f0eeeb] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <Link
            href="/shop-manager/inventory"
            className="px-6 py-3 text-sm font-medium text-[#666] hover:bg-[#f0eeeb] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
