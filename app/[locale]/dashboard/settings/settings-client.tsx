"use client";

import {
  Camera,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Save,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorBanner, FormInput, FormTextarea } from "@/app/components/ui";
import PhoneInput from "@/app/components/phone-input";
import { createClient } from "@/lib/supabase/client";

type ProfileData = {
  id: string;
  display_name: string | null;
  username: string | null;
  phone: string | null;
  bio: string | null;
  email: string;
  whatsapp_number: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
};

export default function SettingsClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    display_name: profile.display_name || "",
    username: profile.username || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    whatsapp_number: profile.whatsapp_number || "",
    telegram_username: profile.telegram_username || "",
  });

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  async function handleAvatarUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }
    setAvatarUploading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) {
        setError(uploadErr.message);
        setAvatarUploading(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: urlWithBust })
        .eq("id", profile.id);

      setAvatarUrl(urlWithBust);
      toast.success("Profile photo updated");
      router.refresh();
    } catch {
      setError("Avatar upload failed. Please try again.");
    }
    setAvatarUploading(false);
  }

  async function handleSave() {
    setError("");
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: formData.display_name || null,
        username: formData.username || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        whatsapp_number: formData.whatsapp_number || null,
        telegram_username:
          formData.telegram_username?.replace(/^@/, "") || null,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success("Profile updated");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Profile Settings</h1>

      <ErrorBanner message={error} />

      <div className="bg-white border border-[#e8e6e3] p-6 space-y-5">
        {/* Avatar upload */}
        <div className="flex items-center gap-5">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile photo"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#e8e6e3]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f0eeeb] to-[#e8e6e3] flex items-center justify-center border-2 border-[#e8e6e3]">
                <User className="w-8 h-8 text-[#bbb]" />
              </div>
            )}

            {/* Hover overlay */}
            {avatarUploading ? (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[#1a1a1a]">Profile Photo</p>
            <p className="text-xs text-[#bbb] mt-0.5">
              JPG, PNG or WebP. Max 2 MB.
            </p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="mt-2 text-xs font-medium text-[#666] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              {avatarUrl ? "Change photo" : "Upload photo"}
            </button>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="border-t border-[#e8e6e3]" />

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
            <User className="w-3.5 h-3.5" /> Display Name
          </label>
          <FormInput
            type="text"
            placeholder="Your name"
            value={formData.display_name}
            onChange={(e) => update("display_name", e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Username
          </label>
          <FormInput
            type="text"
            placeholder="username"
            value={formData.username}
            onChange={(e) =>
              update(
                "username",
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
          />
          <p className="text-xs text-[#bbb] mt-1">
            Only lowercase letters, numbers and underscores
          </p>
        </div>

        {/* Contact Methods */}
        <div className="pt-2 border-t border-[#e8e6e3]">
          <p className="text-sm font-semibold text-[#666] mb-4 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Contact Methods
          </p>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <PhoneInput
                value={formData.phone}
                onChange={(v) => update("phone", v)}
              />
              <p className="text-xs text-[#bbb] mt-1">
                Your primary contact number for buyers.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
                {/* WhatsApp icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Number
              </label>
              <PhoneInput
                value={formData.whatsapp_number}
                onChange={(v) => update("whatsapp_number", v)}
                focusClass="focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100"
              />
              <p className="text-xs text-[#bbb] mt-1">
                Buyers will be able to message you directly on WhatsApp.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
                {/* Telegram icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-sky-500"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bbb] text-sm font-medium">
                  @
                </span>
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
                  placeholder="yourusername"
                  value={formData.telegram_username}
                  onChange={(e) =>
                    update(
                      "telegram_username",
                      e.target.value.replace(/^@/, ""),
                    )
                  }
                />
              </div>
              <p className="text-xs text-[#bbb] mt-1">
                Your Telegram @username. Buyers will be able to open a chat with
                you directly.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Bio
          </label>
          <FormTextarea
            className="h-24"
            placeholder="Tell buyers about yourself..."
            value={formData.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[#666] mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-[#e8e6e3] bg-[#faf9f7] text-sm text-[#999] cursor-not-allowed"
            value={profile.email}
            disabled
          />
          <p className="text-xs text-[#bbb] mt-1">
            Contact support to change your email
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#2C2826] text-white px-6 py-3 font-semibold hover:bg-[#3D3633] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-[#e8e6e3]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Profile
        </button>
      </div>
    </div>
  );
}
