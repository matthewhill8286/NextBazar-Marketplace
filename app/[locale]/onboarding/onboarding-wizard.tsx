"use client";

import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Facebook,
  Instagram,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Send,
  SkipForward,
  Sparkles,
  User,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Category } from "@/lib/supabase/supabase.types";

type FullLocation = Database["public"]["Tables"]["locations"]["Row"];

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
  existingAvatar: string | null;
  categories: Category[];
  locations: FullLocation[];
}

// ─── Telegram icon (Lucide doesn't have one) ─────────────────────────────────

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<Step, string> = {
  1: "Your Profile",
  2: "Social Links",
  3: "Your Location",
  4: "First Listing",
  5: "All Done",
};

const STEP_DESCRIPTIONS: Record<Step, string> = {
  1: "Let buyers and sellers know who you are",
  2: "Help people find you on social media",
  3: "Show listings near you by default",
  4: "Post your first item and start selling",
  5: "Your account is ready to go",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OnboardingWizard({
  userId,
  userName,
  existingAvatar,
  categories,
  locations,
}: Props) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Profile
  const [displayName, setDisplayName] = useState(userName);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(existingAvatar ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — Socials
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [facebook, setFacebook] = useState("");

  // Step 3 — Location
  const [locationId, setLocationId] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [geoGranted, setGeoGranted] = useState(false);

  // Step 4 — Quick listing
  const [listingTitle, setListingTitle] = useState("");
  const [listingCategoryId, setListingCategoryId] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingImage, setListingImage] = useState<File | null>(null);
  const [listingImagePreview, setListingImagePreview] = useState("");
  const listingImageRef = useRef<HTMLInputElement>(null);

  // ─── Avatar upload ─────────────────────────────────────────────────────────

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      // Validate file type
      const ALLOWED_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Invalid file type", {
          description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        });
        return;
      }

      // Validate file size (2 MB limit — matches bucket config)
      const MAX_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error("Image too large", {
          description: "Please choose an image under 2 MB.",
        });
        return;
      }

      setAvatarUploading(true);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      try {
        const { error } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (error) {
          toast.error("Upload failed", {
            description:
              error.message || "Could not upload your photo. Please try again.",
          });
          setAvatarUploading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);
        setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
        toast.success("Photo uploaded");
      } catch {
        toast.error("Upload failed", {
          description:
            "A network error occurred. Please check your connection and try again.",
        });
      } finally {
        setAvatarUploading(false);
      }
    },
    [userId, supabase.storage],
  );

  // ─── Geolocation ───────────────────────────────────────────────────────────

  function requestGeolocation() {
    setGeoLoading(true);
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLat(pos.coords.latitude);
        setLocationLng(pos.coords.longitude);
        setGeoGranted(true);
        setGeoLoading(false);

        // Try to auto-select the closest location
        if (locations.length > 0) {
          let closest = locations[0];
          let minDist = Infinity;
          for (const loc of locations) {
            if (loc.lat != null && loc.lng != null) {
              const d = Math.hypot(
                loc.lat - pos.coords.latitude,
                loc.lng - pos.coords.longitude,
              );
              if (d < minDist) {
                minDist = d;
                closest = loc;
              }
            }
          }
          setLocationId(closest.id);
        }
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Location access was denied. You can select your city manually below."
            : "Unable to determine your location. Please select manually.",
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  // ─── Save profile + finish ─────────────────────────────────────────────────

  async function finishOnboarding(skipListing = true) {
    setSaving(true);

    // Update profile
    await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        instagram_username: instagram.replace(/^@/, "").trim() || null,
        telegram_username: telegram.replace(/^@/, "").trim() || null,
        facebook_username: facebook.trim() || null,
        location_id: locationId || null,
        location_lat: locationLat,
        location_lng: locationLng,
        onboarding_completed: true,
      })
      .eq("id", userId);

    // Notify navbar / other components to re-fetch profile data (e.g. avatar)
    refreshProfile();

    // Create quick listing if provided
    if (!skipListing && listingTitle.trim() && listingCategoryId) {
      const slug =
        // biome-ignore lint/style/useTemplate: this can be addressed at a later date
        listingTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60) + `-${Date.now().toString(36)}`;

      let primaryImageUrl: string | null = null;

      // Upload listing image if provided
      if (listingImage) {
        const ext = listingImage.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${slug}/1.${ext}`;
        const { error: imgErr } = await supabase.storage
          .from("listing-images")
          .upload(path, listingImage, { upsert: true });
        if (!imgErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("listing-images").getPublicUrl(path);
          primaryImageUrl = publicUrl;
        }
      }

      const { data: listing } = await supabase
        .from("listings")
        .insert({
          title: listingTitle.trim(),
          slug,
          category_id: listingCategoryId,
          price: listingPrice ? Number(listingPrice) : null,
          price_type: listingPrice ? "fixed" : "contact",
          user_id: userId,
          status: "active",
          location_id: locationId || null,
          primary_image_url: primaryImageUrl,
        })
        .select("id")
        .single();

      // Insert into listing_images if we uploaded one
      if (listing && primaryImageUrl) {
        await supabase.from("listing_images").insert({
          listing_id: listing.id,
          url: primaryImageUrl,
          position: 0,
        });
      }
    }

    setSaving(false);
    setStep(5);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  function next() {
    if (step < 4) setStep((s) => (s + 1) as Step);
  }

  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[70vh]">
      {/* Step indicator + progress bar */}
      {step < 5 && (
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <p className="text-xs text-[#8a8280] font-medium text-right mb-2">
          Step {step} of 4
        </p>
        <div className="flex gap-2">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? "bg-[#f0eeeb]0" : "bg-[#e8e6e3]"
              }`}
            />
          ))}
        </div>
      </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1.5">
            {STEP_TITLES[step]}
          </h1>
          <p className="text-[#6b6560] text-sm">{STEP_DESCRIPTIONS[step]}</p>
        </div>

        {/* ── Step 1: Profile ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white border border-[#e8e6e3] p-6 shadow-sm space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-[#f0eeeb] border-2 border-dashed border-[#e8e6e3] hover:border-[#8E7A6B] transition-colors flex items-center justify-center overflow-hidden group"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#8a8280] group-hover:text-[#8E7A6B] transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  {avatarUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
              <p className="text-xs text-[#8a8280]">
                {avatarUrl ? "Click to change photo" : "Upload a profile photo"}
              </p>
            </div>

            {/* Display name */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should people know you?"
                className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Short bio{" "}
                <span className="text-[#8a8280] font-normal">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell buyers a bit about yourself..."
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm resize-none"
              />
              <p className="text-xs text-[#8a8280] text-right mt-1">
                {bio.length}/300
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Socials ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white border border-[#e8e6e3] p-6 shadow-sm space-y-5">
            <p className="text-sm text-[#6b6560] text-center">
              These are shown on your public profile so buyers can reach you.
              All fields are optional.
            </p>

            {/* Instagram */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#666] mb-1.5">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8280] text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) =>
                    setInstagram(e.target.value.replace(/^@/, ""))
                  }
                  placeholder="username"
                  className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
                />
              </div>
            </div>

            {/* Telegram */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#666] mb-1.5">
                <TelegramIcon className="w-4 h-4 text-sky-500" />
                Telegram
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8280] text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) =>
                    setTelegram(e.target.value.replace(/^@/, ""))
                  }
                  placeholder="username"
                  className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
                />
              </div>
            </div>

            {/* Facebook */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#666] mb-1.5">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="Profile URL or username"
                className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Location ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white border border-[#e8e6e3] p-6 shadow-sm space-y-6">
            {/* Geolocation request */}
            {!geoGranted ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#f0eeeb] flex items-center justify-center mx-auto">
                  <Navigation className="w-7 h-7 text-[#8E7A6B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-1">
                    Enable location access?
                  </h3>
                  <p className="text-sm text-[#6b6560] max-w-sm mx-auto">
                    We&apos;ll use your location to show you nearby listings and
                    help buyers find your items. Your exact coordinates are
                    never shared publicly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestGeolocation}
                  disabled={geoLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors disabled:opacity-60"
                >
                  {geoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  Allow Location Access
                </button>
                {geoError && (
                  <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 ">
                    {geoError}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-green-700 font-medium">
                  Location access granted
                </p>
              </div>
            )}

            {/* Manual location selector (always visible) */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                {geoGranted
                  ? "Confirm your city"
                  : "Or select your city manually"}
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm bg-white"
              >
                <option value="">Select a city...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 4: Quick Listing ───────────────────────────────────────── */}
        {step === 4 && (
          <div className="bg-white border border-[#e8e6e3] p-6 shadow-sm space-y-5">
            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-[#8E7A6B]" />
              </div>
              <p className="text-sm text-[#6b6560]">
                Got something to sell? Create a quick listing now, or skip and
                do it later.
              </p>
            </div>

            {/* Listing image */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Photo{" "}
                <span className="text-[#8a8280] font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => listingImageRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-[#e8e6e3] hover:border-[#8E7A6B] transition-colors flex flex-col items-center justify-center gap-2 overflow-hidden relative group"
              >
                {listingImagePreview ? (
                  <>
                    <Image
                      src={listingImagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-[#8a8280]" />
                    <span className="text-xs text-[#8a8280]">Add a photo</span>
                  </>
                )}
              </button>
              <input
                ref={listingImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setListingImage(file);
                    setListingImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                What are you selling?
              </label>
              <input
                type="text"
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
                placeholder='e.g. "iPhone 15 Pro — Like New"'
                className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Category
              </label>
              <select
                value={listingCategoryId}
                onChange={(e) => setListingCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm bg-white"
              >
                <option value="">Choose a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Price{" "}
                <span className="text-[#8a8280] font-normal">
                  (leave blank for &ldquo;Contact for price&rdquo;)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8280] font-medium">
                  €
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Success + Upsell ────────────────────────────────────── */}
        {step === 5 && (
          <div className="bg-white border border-[#e8e6e3] p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              You&apos;re all set!
            </h2>
            <p className="text-[#6b6560] text-sm mb-8 max-w-sm mx-auto">
              Your profile is live. Start browsing listings or post your first
              item to sell.
            </p>

            {/* Upsell CTA */}
            <div className="bg-gradient-to-br from-[#faf9f7] to-[#f0eeeb] border border-[#e8e6e3] p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#8E7A6B]" />
                <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#8E7A6B]">
                  Go Pro
                </span>
              </div>
              <p className="text-[#1a1a1a] font-semibold mb-1">
                Ready to sell more?
              </p>
              <p className="text-[#6b6560] text-sm mb-4 max-w-xs mx-auto">
                You&apos;re on Starter (5 listings). Upgrade to Pro for 50
                listings, analytics, and your own branded shop page.
              </p>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors shadow-sm"
              >
                View Plans — from €29/mo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Primary actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  router.push("/");
                  router.refresh();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#e8e6e3] text-[#1a1a1a] font-semibold text-sm hover:bg-[#faf9f7] transition-colors"
              >
                Browse Listings
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/post");
                  router.refresh();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-semibold text-sm hover:bg-[#333] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post Your First Listing
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ──────────────────────────────────────────── */}
        {step < 5 && (
        <div className="flex items-center justify-between mt-8">
          {/* Back */}
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="text-sm text-[#6b6560] hover:text-[#666] font-medium transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {/* Forward */}
          <div className="flex items-center gap-3">
            {/* Skip on steps 2, 3, and 4 */}
            {step >= 2 && step <= 3 && (
              <button
                type="button"
                onClick={next}
                className="text-sm text-[#8a8280] hover:text-[#666] font-medium transition-colors flex items-center gap-1"
              >
                Skip <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                disabled={step === 1 && !displayName.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#8E7A6B]/15"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {/* Skip listing */}
                <button
                  type="button"
                  onClick={() => finishOnboarding(true)}
                  disabled={saving}
                  className="text-sm text-[#8a8280] hover:text-[#666] font-medium transition-colors flex items-center gap-1"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip for now
                </button>

                {/* Post listing + finish */}
                <button
                  type="button"
                  onClick={() => finishOnboarding(false)}
                  disabled={
                    saving || !listingTitle.trim() || !listingCategoryId
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#8E7A6B]/15"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post &amp; Finish
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
