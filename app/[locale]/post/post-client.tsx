"use client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import StripeCheckoutModal from "@/app/components/stripe-checkout-modal";
import { ErrorBanner } from "@/app/components/ui";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { useReferenceData } from "@/lib/hooks/use-reference-data";
import { getPlanLimits } from "@/lib/plan-limits";
import type { SellerTier } from "@/lib/pricing-config";
import type { ClientPricing } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import PostStep1 from "./post-step-1";
import PostStep2 from "./post-step-2";
import PostStep3 from "./post-step-3";
import type {
  FormData,
  PricingData,
  UploadedImage,
  UploadedVideo,
  VehicleAttributes,
} from "./post-types";
import { EMPTY_VEHICLE_ATTRS, VEHICLES_CATEGORY_SLUG } from "./post-types";

export default function PostClient({ pricing }: { pricing: ClientPricing }) {
  const router = useRouter();
  const t = useTranslations("post");
  const supabase = createClient();
  const { categories, subcategories, locations } = useReferenceData();

  const [step, setStep] = useState(1);

  function goToStep(n: number) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
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
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [selectedPriceKey, setSelectedPriceKey] = useState<
    "low" | "suggested" | "high" | null
  >(null);
  const [selectedPackage, setSelectedPackage] = useState<
    "free" | "featured" | "urgent"
  >("free");
  const [vehicleAttrs, setVehicleAttrs] = useState<VehicleAttributes>({
    ...EMPTY_VEHICLE_ATTRS,
  });
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category_id: "",
    subcategory_id: "",
    price: "",
    price_type: "fixed",
    description: "",
    condition: "good",
    location_id: "",
    contact_phone: "",
    quantity: "",
    low_stock_threshold: "3",
  });

  // Determine if current category is "vehicles"
  const selectedCategory = categories.find(
    (c) => c.id === formData.category_id,
  );
  const selectedSubcategory = subcategories.find(
    (s) => s.id === formData.subcategory_id,
  );
  const isParts = selectedSubcategory?.slug === "parts-accessories";
  const isVehicle =
    selectedCategory?.slug === VEHICLES_CATEGORY_SLUG && !isParts;

  const { userId: authUserId } = useAuth();
  const [planTier, setPlanTier] = useState<SellerTier>("starter");
  const limits = getPlanLimits(planTier);

  useEffect(() => {
    if (!authUserId) return;
    setUserId(authUserId);
    // Auto-populate phone from profile
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", authUserId)
      .single()
      .then(({ data: profile }) => {
        if (profile?.phone) {
          setFormData((prev) => ({ ...prev, contact_phone: profile.phone }));
        }
      });
    // Fetch dealer plan tier if applicable
    supabase
      .from("dealer_shops")
      .select("plan_tier, plan_status")
      .eq("user_id", authUserId)
      .single()
      .then(({ data: shop }) => {
        if (shop?.plan_status === "active" && shop.plan_tier) {
          setPlanTier(shop.plan_tier as SellerTier);
        }
      });
  }, [authUserId, supabase]);

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
        category_id: data.category_id || prev.category_id,
        subcategory_id: data.subcategory_id || prev.subcategory_id,
      }));

      // If AI detected a vehicle, pre-fill vehicle attributes from the image
      if (
        data.vehicle_attributes &&
        typeof data.vehicle_attributes === "object"
      ) {
        setVehicleAttrs((prev) => {
          const merged = { ...prev };
          for (const [k, v] of Object.entries(data.vehicle_attributes)) {
            if (v && typeof v === "string" && k in prev) {
              (merged as any)[k] = v;
            }
          }
          return merged;
        });
      }

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
          category: category?.name,
          condition: formData.condition,
          imageUrl: firstImage?.url || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
      }
    } catch {
      // Silent fail
    }
    setDescLoading(false);
  }

  async function handleAiPricing() {
    if (!formData.title) return;
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPricingData(data);
    } catch {}
    setPricingLoading(false);
  }

  const updateVehicleAttr = (key: keyof VehicleAttributes, value: string) =>
    setVehicleAttrs((prev) => ({ ...prev, [key]: value }));

  async function handlePublish() {
    setError("");
    setLoading(true);

    if (!userId) {
      router.push("/auth/login?redirect=/post");
      return;
    }

    // Ensure the user has a display name before publishing
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, location_id")
      .eq("id", userId)
      .single();

    if (!profile?.display_name) {
      setError(
        "Please add a display name before posting. Go to Dashboard → Settings to set one up.",
      );
      setLoading(false);
      return;
    }

    // Check active listing limit for the user's plan tier
    if (limits.activeListings !== "unlimited") {
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active");
      if ((count ?? 0) >= limits.activeListings) {
        setError(
          `You've reached your limit of ${limits.activeListings} active listings on the ${limits.tierLabel} plan. Upgrade to list more.`,
        );
        setLoading(false);
        return;
      }
    }

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

    // Build attributes JSON for category-specific fields (e.g. vehicle details)
    const hasVehicleData =
      isVehicle && Object.values(vehicleAttrs).some((v) => v.trim() !== "");
    const attributes = hasVehicleData ? vehicleAttrs : null;

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        user_id: userId,
        title: formData.title,
        slug: "", // auto-generated by trigger
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        location_id: formData.location_id || null,
        description: formData.description,
        price: formData.price ? Number(formData.price) : null,
        price_type: formData.price_type,
        condition: formData.condition || null,
        contact_phone: formData.contact_phone || null,
        // Paid listings start as draft — activated by Stripe webhook on payment success
        status: selectedPackage === "free" ? "active" : "draft",
        primary_image_url: uploadedUrls[0] || null,
        image_count: uploadedUrls.length,
        video_url: video?.url || null,
        ...(attributes ? { attributes } : {}),
        ...(formData.quantity
          ? {
              quantity: Number(formData.quantity),
              low_stock_threshold: Number(formData.low_stock_threshold) || 3,
            }
          : {}),
      })
      .select("id, slug")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

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
      }
    }

    if (selectedPackage !== "free") {
      setCheckoutListing({ id: data.id, slug: data.slug });
      setLoading(false);
      return;
    }

    router.push(`/listing/${data.slug}`);
  }

  return (
    <div
      className={`mx-auto px-4 py-8 transition-all ${step === 3 ? "max-w-5xl" : "max-w-2xl"}`}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-3">
            <div className="flex-1">
              <div
                className={`h-[2px] transition-colors ${s <= step ? "bg-[#2C2826]" : "bg-[#e8e6e3]"}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mb-8">
        {[
          { key: "step1", label: t("step1.heading") },
          { key: "step2", label: t("step2.heading") },
          { key: "step3", label: t("step3.heading") },
        ].map((item, i) => (
          <span
            key={item.key}
            className={`text-[10px] font-medium tracking-[0.15em] uppercase ${i + 1 <= step ? "text-[#1a1a1a]" : "text-[#8a8280]"}`}
          >
            {item.label}
          </span>
        ))}
      </div>

      <ErrorBanner message={error} />

      {step === 1 && (
        <PostStep1
          userId={userId}
          images={images}
          formData={formData}
          categories={categories}
          visibleSubcategories={visibleSubcategories}
          aiLoading={aiLoading}
          aiFilled={aiFilled}
          maxImages={limits.imagesPerListing}
          onImagesChangeAction={handleImagesChange}
          onAiAutofillAction={handleAiAutofill}
          onUpdateAction={update}
          onSelectCategoryAction={selectCategory}
          onNextAction={() => goToStep(2)}
        />
      )}

      {step === 2 && (
        <PostStep2
          formData={formData}
          locations={locations}
          pricingData={pricingData}
          pricingLoading={pricingLoading}
          selectedPriceKey={selectedPriceKey}
          descLoading={descLoading}
          canUseAiDescriptions={limits.aiDescriptions}
          isVehicle={isVehicle}
          vehicleAttrs={vehicleAttrs}
          onUpdateAction={update}
          onSelectPriceKeyAction={setSelectedPriceKey}
          onAiDescriptionAction={handleAiDescription}
          onAiPricingAction={handleAiPricing}
          onVehicleAttrUpdateAction={updateVehicleAttr}
          onBackAction={() => goToStep(1)}
          onNextAction={() => goToStep(3)}
        />
      )}

      {step === 3 && (
        <PostStep3
          formData={formData}
          images={images}
          video={video}
          userId={userId}
          selectedPackage={selectedPackage}
          loading={loading}
          categories={categories}
          locations={locations}
          isVehicle={isVehicle}
          vehicleAttrs={vehicleAttrs}
          pricing={pricing}
          onSetPackageAction={setSelectedPackage}
          onSetVideoAction={setVideo}
          onBackAction={() => goToStep(2)}
          onPublishAction={handlePublish}
        />
      )}

      {/* Embedded Stripe checkout — opens after listing is created */}
      {checkoutListing && (
        <StripeCheckoutModal
          listingId={checkoutListing.id}
          promotionType={selectedPackage as "featured" | "urgent"}
          pricing={pricing}
          onCloseAction={() => {
            // User dismissed without paying — listing saved as draft, send to drafts tab
            router.push("/dashboard?tab=draft");
          }}
        />
      )}
    </div>
  );
}
