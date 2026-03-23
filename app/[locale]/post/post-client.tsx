"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Lightbulb,
  Loader2,
  PenLine,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import type { UploadedImage } from "@/app/components/image-upload";
import ImageUpload from "@/app/components/image-upload";
import StripeCheckoutModal from "@/app/components/stripe-checkout-modal";
import type { UploadedVideo } from "@/app/components/video-upload";
import VideoUpload from "@/app/components/video-upload";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string; slug: string; icon: string };
type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
};
type Location = { id: string; name: string; slug: string };

export default function PostClient() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [checkoutListing, setCheckoutListing] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingData, setPricingData] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<
    "free" | "featured" | "urgent"
  >("free");
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

  useEffect(() => {
    async function loadData() {
      const [
        { data: cats },
        { data: subs },
        { data: locs },
        {
          data: { user },
        },
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, icon")
          .order("sort_order"),
        supabase
          .from("subcategories")
          .select("id, category_id, name, slug, sort_order")
          .order("sort_order"),
        supabase.from("locations").select("id, name, slug").order("sort_order"),
        supabase.auth.getUser(),
      ]);
      if (cats) setCategories(cats);
      if (subs) setSubcategories(subs);
      if (locs) setLocations(locs);
      if (user) {
        setUserId(user.id);
        // Auto-populate phone from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();
        if (profile?.phone) {
          setFormData((prev) => ({ ...prev, contact_phone: profile.phone }));
        }
      }
    }
    loadData();
  }, [supabase.from, supabase.auth.getUser]);

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // When the category changes, clear the subcategory selection
  const selectCategory = (id: string) =>
    setFormData((prev) => ({ ...prev, category_id: id, subcategory_id: "" }));

  // Subcategories for the currently selected category
  const visibleSubcategories = subcategories.filter(
    (s) => s.category_id === formData.category_id,
  );

  const handleImagesChange = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
  }, []);

  async function handleAiAutofill() {
    // Find the first uploaded image with a URL
    const firstUploaded = images.find((img) => img.url && !img.uploading);
    if (!firstUploaded?.url) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: firstUploaded.url }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        category_id: data.category_id || prev.category_id,
        condition: data.condition || prev.condition,
        price: data.suggested_price?.toString() || prev.price,
      }));
      setAiFilled(true);
    } catch {
      // Silent fail — user can still fill manually
    }
    setAiLoading(false);
  }

  async function handleAiDescription() {
    if (!formData.title) return;
    setDescLoading(true);
    try {
      const firstImage = images.find((img) => img.url && !img.uploading);
      const category = categories.find((c) => c.id === formData.category_id);
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: category?.name || "",
          condition: formData.condition,
          price: formData.price || null,
          imageUrl: firstImage?.url || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
      }
    } catch {}
    setDescLoading(false);
  }

  async function handleAiPricing() {
    if (!formData.title) return;
    setPricingLoading(true);
    setPricingData(null);
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPricingData(data);
    } catch {}
    setPricingLoading(false);
  }

  async function handlePublish() {
    setError("");
    setLoading(true);

    if (!userId) {
      router.push("/auth/login?redirect=/post");
      return;
    }

    // Wait for any uploads still in progress
    const pendingUploads = images.some((img) => img.uploading);
    if (pendingUploads) {
      setError("Please wait for all images to finish uploading.");
      setLoading(false);
      return;
    }
    if (video?.uploading) {
      setError("Please wait for your video to finish uploading.");
      setLoading(false);
      return;
    }

    const uploadedUrls = images.filter((img) => img.url).map((img) => img.url!);

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        user_id: userId,
        title: formData.title,
        slug: "", // auto-generated by trigger
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        location_id: formData.location_id || null,
        description: formData.description,
        price: formData.price ? Number(formData.price) : null,
        price_type: formData.price_type,
        condition: formData.condition || null,
        contact_phone: formData.contact_phone || null,
        status: "active",
        primary_image_url: uploadedUrls[0] || null,
        image_count: uploadedUrls.length,
        video_url: video?.url || null,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Insert listing images
    if (uploadedUrls.length > 0) {
      const imageRecords = uploadedUrls.map((url, idx) => ({
        listing_id: data.id,
        url,
        sort_order: idx,
      }));
      const { error: imgError } = await supabase
        .from("listing_images")
        .insert(imageRecords);
      if (imgError) {
        console.error("listing_images insert error:", imgError);
        // Non-fatal — listing is created, images can be re-added from dashboard
      }
    }

    // If a paid promotion, open the embedded Stripe checkout modal
    if (selectedPackage !== "free") {
      setCheckoutListing({ id: data.id, slug: data.slug });
      setLoading(false);
      return;
    }

    router.push(`/listing/${data.slug}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1">
            <div
              className={`h-2 rounded-full transition-colors ${s <= step ? "bg-indigo-500" : "bg-gray-200"}`}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* Step 1 — Photos & Title */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            What are you selling?
          </h2>

          {/* Image Upload */}
          {userId ? (
            <ImageUpload
              userId={userId}
              images={images}
              onChangeAction={handleImagesChange}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-white">
              <p className="text-gray-500 text-sm">
                <a
                  href="/auth/login?redirect=/post"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign in
                </a>{" "}
                to upload photos
              </p>
            </div>
          )}

          {/* AI Auto-fill button */}
          {images.some((img) => img.url && !img.uploading) && !aiFilled && (
            <button
              type="button"
              onClick={handleAiAutofill}
              disabled={aiLoading}
              className="w-full bg-linear-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-indigo-200"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is analyzing your photo...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Auto-fill with AI
                </>
              )}
            </button>
          )}
          {aiFilled && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-xl border border-green-100">
              <Sparkles className="w-4 h-4" />
              AI filled in your listing details — review and adjust below
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              placeholder="e.g. iPhone 15 Pro Max 256GB Blue"
              value={formData.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.category_id === cat.id
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-10 h-10 ${getCategoryConfig(cat.slug).bg} rounded-xl flex items-center justify-center mb-1 mx-auto`}
                  >
                    <CategoryIcon slug={cat.slug} size={20} />
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    {cat.name}
                  </div>
                </button>
              ))}
            </div>

            {/* Subcategory drill-down — appears once a category is picked */}
            {visibleSubcategories.length > 0 && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {visibleSubcategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        update(
                          "subcategory_id",
                          formData.subcategory_id === sub.id ? "" : sub.id,
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        formData.subcategory_id === sub.id
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!formData.title || !formData.category_id}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
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
                onClick={handleAiDescription}
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
              onChange={(e) => update("description", e.target.value)}
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
                  onClick={handleAiPricing}
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
                  onChange={(e) => update("price", e.target.value)}
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
                onChange={(e) => update("condition", e.target.value)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price Type
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
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

          {/* AI Pricing Guide Panel */}
          {pricingData && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-900 text-sm">
                  AI Pricing Guide
                </span>
                {pricingData.market?.similar_count > 0 && (
                  <span className="text-xs text-indigo-400 ml-auto">
                    Based on {pricingData.market.similar_count} similar listings
                  </span>
                )}
              </div>

              {/* Price suggestions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    update("price", pricingData.price_low?.toString() || "")
                  }
                  className="bg-white/80 rounded-lg p-3 text-center hover:ring-2 hover:ring-indigo-200 transition-all cursor-pointer"
                >
                  <div className="text-[10px] text-gray-500 font-medium mb-0.5">
                    Quick Sale
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    €{pricingData.price_low?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-green-600">Competitive</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "price",
                      pricingData.suggested_price?.toString() || "",
                    )
                  }
                  className="bg-white rounded-lg p-3 text-center ring-2 ring-indigo-300 cursor-pointer"
                >
                  <div className="text-[10px] text-indigo-600 font-semibold mb-0.5">
                    Recommended
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    €{pricingData.suggested_price?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-indigo-600">Fair value</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update("price", pricingData.price_high?.toString() || "")
                  }
                  className="bg-white/80 rounded-lg p-3 text-center hover:ring-2 hover:ring-indigo-200 transition-all cursor-pointer"
                >
                  <div className="text-[10px] text-gray-500 font-medium mb-0.5">
                    Premium
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    €{pricingData.price_high?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-600">Patient sell</div>
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
                  {pricingData.tips.map((tip: string, i: number) => (
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

              {/* Click to apply */}
              <p className="text-[10px] text-indigo-400 text-center">
                Click a price above to apply it
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
              onChange={(e) => update("contact_phone", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Add a phone number so buyers can call you directly. Leave blank to
              only use messaging.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Boost & Publish */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Boost Your Listing
          </h2>

          {/* Preview summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
            <div className="flex gap-4">
              {images[0] && (
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <img
                    src={images[0].preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{formData.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formData.price
                    ? `€${Number(formData.price).toLocaleString()}`
                    : "Contact for price"}
                  {" · "}
                  {images.length} photo{images.length !== 1 ? "s" : ""}
                  {video?.url ? " · 1 video" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Free tier */}
            <button
              type="button"
              onClick={() => setSelectedPackage("free")}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                selectedPackage === "free"
                  ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    Free Listing
                  </div>
                  <div className="text-sm text-gray-500">
                    Standard visibility for 30 days
                  </div>
                </div>
                <div className="font-bold text-gray-900">Free</div>
              </div>
            </button>

            {/* Featured tier */}
            <button
              type="button"
              onClick={() => setSelectedPackage("featured")}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all relative ${
                selectedPackage === "featured"
                  ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-100"
                  : "border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 hover:border-amber-400"
              }`}
            >
              <div className="absolute -top-2.5 right-4 bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                POPULAR
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    Featured Listing
                  </div>
                  <div className="text-sm text-gray-500">
                    Top placement + highlighted badge for 7 days · Up to 5× more
                    views
                  </div>
                </div>
                <div className="font-bold text-amber-600 ml-4 shrink-0">
                  €4.99
                </div>
              </div>
            </button>

            {/* Urgent tier */}
            <button
              type="button"
              onClick={() => setSelectedPackage("urgent")}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                selectedPackage === "urgent"
                  ? "border-red-400 bg-red-50/50 ring-2 ring-red-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    Urgent Badge
                  </div>
                  <div className="text-sm text-gray-500">
                    Urgent badge + priority in search for 3 days · Up to 3× more
                    views
                  </div>
                </div>
                <div className="font-bold text-red-600 ml-4 shrink-0">
                  €2.99
                </div>
              </div>
            </button>
          </div>

          {/* Video Tour — paid tiers only */}
          {selectedPackage !== "free" && userId && (
            <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    🎬 Video Tour
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add a short video to showcase your item — included with your
                    paid listing
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">
                  INCLUDED
                </span>
              </div>
              <VideoUpload
                userId={userId}
                video={video}
                onChangeAction={setVideo}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
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
                "Publish & Feature — €4.99"
              ) : (
                "Publish & Boost — €2.99"
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
      )}

      {/* Embedded Stripe checkout — opens after listing is created */}
      {checkoutListing && (
        <StripeCheckoutModal
          listingId={checkoutListing.id}
          promotionType={selectedPackage as "featured" | "urgent"}
          onCloseAction={() => {
            // User dismissed without paying — go to listing (it's live, just unpromoted)
            router.push(`/listing/${checkoutListing.slug}`);
          }}
        />
      )}
    </div>
  );
}
