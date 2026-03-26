"use client";

import { ArrowRight, Camera, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

/**
 * A gentle nudge banner for pro sellers who haven't completed their profile.
 * Shows on the dashboard and shop pages until they add a photo + bio,
 * or until they dismiss it (stored in localStorage).
 */
export default function ProfileNudge() {
  const { userId } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check if user already dismissed this nudge
    try {
      if (window.sessionStorage.getItem("profile-nudge-dismissed")) {
        return;
      }
    } catch {
      // ignore storage errors
    }

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("avatar_url, bio, onboarding_completed")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        // Show nudge if profile is incomplete (no avatar or no bio)
        const incomplete = !data.avatar_url || !data.bio;
        if (incomplete) setShow(true);
      });
  }, [userId]);

  function dismiss() {
    setDismissed(true);
    setShow(false);
    try {
      window.sessionStorage.setItem("profile-nudge-dismissed", "1");
    } catch {
      // ignore
    }
  }

  if (!show || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
        <Camera className="w-4.5 h-4.5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-0.5">
          Complete your profile to build trust
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Sellers with a photo and bio get 3× more enquiries. Add yours now — it
          only takes a minute.
        </p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors mt-2"
        >
          Complete your profile
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <button
        onClick={dismiss}
        className="w-6 h-6 rounded-lg hover:bg-amber-100 flex items-center justify-center text-amber-400 hover:text-amber-600 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
