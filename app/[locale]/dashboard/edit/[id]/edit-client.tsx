"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { UploadedImage } from "@/app/components/image-upload";
import ImageUpload from "@/app/components/image-upload";
import type { UploadedVideo } from "@/app/components/video-upload";
import VideoUpload from "@/app/components/video-upload";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string; slug: string; icon: string };
type Location = { id: string; name: string; slug: string };

type ListingData = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_type: string;
  condition: string | null;
  contact_phone: string | null;
  category_id: string;
  location_id: string | null;
  user_id: string;
  primary_image_url: string | null;
  is_promoted: boolean;
  video_url: string | null;
  images: { id: string; url: string; sort_order: number }[];
};

export default function EditClient({ listing }: { listing: ListingData }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [images, setImages] = useState<UploadedImage[]>(
    listing.images.map((img) => ({
      id: img.id,
      file: null as unknown as File,
      preview: img.url,
      url: img.url,
      uploading: false,
    })),
  );

  // Initialize video state from existing video_url (if any)
  const [video, setVideo] = useState<UploadedVideo | null>(
    listing.video_url
      ? {
          file: null,
          previewUrl: listing.video_url,
          url: listing.video_url,
          uploading: false,
          progress: 100,
        }
      : null,
  );

  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description || "",
    price: listing.price?.toString() || "",
    price_type: listing.price_type,
    condition: listing.condition || "good",
    contact_phone: listing.contact_phone || "",
    category_id: listing.category_id,
    location_id: listing.location_id || "",
  });

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: locs }] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, icon")
          .order("sort_order"),
        supabase.from("locations").select("id, name, slug").order("sort_order"),
      ]);
      if (cats) setCategories(cats);
      if (locs) setLocations(locs);
    }
    load();
  }, [supabase.from]);

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleImagesChange = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
  }, []);

  async function handleSave() {
    setError("");
    setSuccess(false);
    setLoading(true);

    const uploadedUrls = images.filter((img) => img.url).map((img) => img.url!);

    if (video?.uploading) {
      setError("Please wait for your video to finish uploading.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title: formData.title,
        description: formData.description || null,
        price: formData.price ? Number(formData.price) : null,
        price_type: formData.price_type,
        condition: formData.condition || null,
        contact_phone: formData.contact_phone || null,
        category_id: formData.category_id,
        location_id: formData.location_id || null,
        primary_image_url: uploadedUrls[0] || null,
        image_count: uploadedUrls.length,
        video_url: video?.url || null,
      })
      .eq("id", listing.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Fire price-drop notifications if price was lowered
    const oldPrice = listing.price;
    const newPrice = formData.price ? Number(formData.price) : null;
    if (oldPrice && newPrice && newPrice < oldPrice) {
      fetch("/api/notify/price-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          old_price: oldPrice,
          new_price: newPrice,
        }),
      }).catch(() => {});
    }

    // Sync listing_images: delete old, insert new
    await supabase.from("listing_images").delete().eq("listing_id", listing.id);

    if (uploadedUrls.length > 0) {
      await supabase.from("listing_images").insert(
        uploadedUrls.map((url, idx) => ({
          listing_id: listing.id,
          url,
          sort_order: idx,
        })),
      );
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/listings"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          Listing updated successfully!
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {/* Images */}
        <ImageUpload
          userId={listing.user_id}
          images={images}
          onChangeAction={handleImagesChange}
        />

        {/* Video Tour — promoted listings only */}
        {listing.is_promoted && (
          <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  🎬 Video Tour
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add or replace a short video — included with your Featured
                  listing
                </p>
              </div>
              <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">
                PAID FEATURE
              </span>
            </div>
            <VideoUpload
              userId={listing.user_id}
              video={video}
              onChangeAction={setVideo}
            />
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
            value={formData.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm h-32 resize-none"
            value={formData.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        {/* Price & Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Price (€)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                €
              </span>
              <input
                type="number"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                value={formData.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>
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

        {/* Category & Location & Condition */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
              value={formData.category_id}
              onChange={(e) => update("category_id", e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
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

        {/* Phone */}
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
            Leave blank to hide the phone button on your listing.
          </p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={loading || !formData.title}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
          <Link
            href="/dashboard/listings"
            className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
