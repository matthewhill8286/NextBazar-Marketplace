"use client";

import {
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Save,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
};

export default function SettingsClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
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

  async function handleSave() {
    setError("");
    setSuccess(false);
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
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          Profile updated!
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <User className="w-3.5 h-3.5" /> Display Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            placeholder="Your name"
            value={formData.display_name}
            onChange={(e) => update("display_name", e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Username
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            placeholder="username"
            value={formData.username}
            onChange={(e) =>
              update(
                "username",
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
          />
          <p className="text-xs text-gray-400 mt-1">
            Only lowercase letters, numbers and underscores
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            placeholder="+357 99 123456"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        {/* Contact Methods */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Contact Methods
          </p>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
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
              <input
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                placeholder="+357 99 123456"
                value={formData.whatsapp_number}
                onChange={(e) => update("whatsapp_number", e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Include country code (e.g. +357 for Cyprus). Buyers will be able
                to message you directly on WhatsApp.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  @
                </span>
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
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
              <p className="text-xs text-gray-400 mt-1">
                Your Telegram @username. Buyers will be able to open a chat with
                you directly.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Bio
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm h-24 resize-none"
            placeholder="Tell buyers about yourself..."
            value={formData.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
            value={profile.email}
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">
            Contact support to change your email
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-blue-200"
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
