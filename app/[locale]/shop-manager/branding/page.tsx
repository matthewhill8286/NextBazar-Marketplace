"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandingForm, {
  type BrandingState,
} from "../../dashboard/dealer/branding-form";
import { useShopCMS } from "../shop-context";

export default function ShopBrandingPage() {
  const { shop, userId, refresh } = useShopCMS();
  const supabase = createClient();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const [branding, setBranding] = useState<BrandingState>({
    shopName: shop?.shop_name ?? "",
    slug: shop?.slug ?? "",
    description: shop?.description ?? "",
    accentColor: shop?.accent_color ?? "#8E7A6B",
    bannerUrl: shop?.banner_url ?? "",
    website: shop?.website ?? "",
    facebook: shop?.facebook ?? "",
    instagram: shop?.instagram ?? "",
  });

  const handleBrandingChange = useCallback(
    <K extends keyof BrandingState>(key: K, value: BrandingState[K]) => {
      setBranding((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  async function handleSaveBranding() {
    if (!shop) return;
    setSaving(true);

    const slugValue = shop.slug
      ? shop.slug
      : branding.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const { error } = await supabase
      .from("dealer_shops")
      .update({
        shop_name: branding.shopName,
        slug: slugValue,
        description: branding.description,
        accent_color: branding.accentColor,
        banner_url: branding.bannerUrl || null,
        website: branding.website || null,
        facebook: branding.facebook || null,
        instagram: branding.instagram || null,
      })
      .eq("id", shop.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to save changes", { description: error.message });
    } else {
      toast.success("Shop branding updated");
      refresh();
      router.refresh();
    }
  }

  async function handleBannerUpload(file: File) {
    if (!userId || !shop) return;
    setBannerUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/banner.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error("Banner upload failed", { description: error.message });
        setBannerUploading(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("dealer_shops")
        .update({ banner_url: urlWithCacheBust })
        .eq("id", shop.id);

      setBranding((prev) => ({ ...prev, bannerUrl: urlWithCacheBust }));
      toast.success("Banner uploaded");
    } catch {
      toast.error("Banner upload failed");
    }
    setBannerUploading(false);
  }

  async function handleBannerRemove() {
    if (!shop) return;
    await supabase
      .from("dealer_shops")
      .update({ banner_url: null })
      .eq("id", shop.id);
    setBranding((prev) => ({ ...prev, bannerUrl: "" }));
    toast.success("Banner removed");
  }

  return (
    <BrandingForm
      state={branding}
      saving={saving}
      bannerUploading={bannerUploading}
      slugLocked={!!shop?.slug}
      onChange={handleBrandingChange}
      onBannerUploadAction={handleBannerUpload}
      onBannerRemoveAction={handleBannerRemove}
      onSaveAction={handleSaveBranding}
    />
  );
}
