"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StripeCheckoutModal from "@/app/components/stripe-checkout-modal";
import { ErrorBanner } from "@/app/components/ui";
import { useReferenceData } from "@/lib/hooks/use-reference-data";
import { createClient } from "@/lib/supabase/client";
import type {
  FormData,
  PricingData,
  UploadedImage,
  UploadedVideo,
} from "./post-types";
import PostStep1 from "./post-step-1";
import PostStep2 from "./post-step-2";
import PostStep3 from "./post-step-3";

export default function PostClient() {
  const router = useRouter();
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
  const [selectedPriceKey, setSelectedPriceKey] = useState<"low" | "suggested" | "high" | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<
    "free" | "featured" | "urgent"
  >("free");
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
  });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    loadUser();
  }, [supabase]);

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

  async function handlePublish() {
    setError("");
    setLoading(true);

    if (!userId) {
      router.push("/auth/login?redirect=/post");
      return;
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
        // Paid listings start as draft — activated by Stripe webhook on payment success
        status: selectedPackage === "free" ? "active" : "draft",
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
          onImagesChange={handleImagesChange}
          onAiAutofill={handleAiAutofill}
          onUpdate={update}
          onSelectCategory={selectCategory}
          onNext={() => goToStep(2)}
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
          onUpdate={update}
          onSelectPriceKey={setSelectedPriceKey}
          onAiDescription={handleAiDescription}
          onAiPricing={handleAiPricing}
          onBack={() => goToStep(1)}
          onNext={() => goToStep(3)}
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
          onSetPackage={setSelectedPackage}
          onSetVideo={setVideo}
          onBack={() => goToStep(2)}
          onPublish={handlePublish}
        />
      )}

      {/* Embedded Stripe checkout — opens after listing is created */}
      {checkoutListing && (
        <StripeCheckoutModal
          listingId={checkoutListing.id}
          promotionType={selectedPackage as "featured" | "urgent"}
          onCloseAction={() => {
            // User dismissed without paying — listing saved as draft, send to dashboard
            router.push("/dashboard?tab=active");
          }}
        />
      )}
    </div>
  );
}
