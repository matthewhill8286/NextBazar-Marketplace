"use client";

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_pro_seller: boolean;
};

export default function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const tAuth = useTranslations("auth");
  const tDash = useTranslations("dashboard");
  const {
    userId: authUserId,
    loading: authLoading,
    profileVersion,
  } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.startsWith("/el")
    ? "el"
    : pathname.startsWith("/ru")
      ? "ru"
      : "en";

  function switchLocale(newLocale: string) {
    const strippedPath = pathname.replace(/^\/(en|el|ru)(\/|$)/, "/") || "/";
    setOpen(false);
    router.push(strippedPath, { locale: newLocale as "en" | "el" | "ru" });
  }

  // ── Load profile when auth user changes (no extra getUser() call) ────────
  useEffect(() => {
    if (authLoading) return;

    if (!authUserId) {
      setUser(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("display_name, avatar_url, is_pro_seller")
      .eq("id", authUserId)
      .single()
      .then(({ data: profile }) => {
        setUser({
          id: authUserId,
          email: "", // email not needed for display
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          is_pro_seller: profile?.is_pro_seller || false,
        });
        setLoading(false);
      });
  }, [authUserId, authLoading, profileVersion]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="w-9 h-9 bg-[#f0eeeb] rounded-full animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-sm text-[#666] hover:text-[#1a1a1a] px-3 py-2 hover:bg-[#faf9f7] transition-colors font-medium"
      >
        {tAuth("login")}
      </Link>
    );
  }

  const initials =
    user.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || user.email[0]?.toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button with chevron indicator */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="User menu"
        className="pointer-events-auto flex items-center gap-1.5 group"
      >
        <div className="relative w-9 h-9 bg-[#8E7A6B] rounded-full flex items-center justify-center text-white font-semibold text-xs group-hover:shadow-md transition-shadow">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="user avatar"
              width={36}
              height={36}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6b6560] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-60 bg-white border border-[#e8e6e3] shadow-sm py-2 z-50">
          {/* User info */}
          <div className="px-4 py-2.5 border-b border-[#e8e6e3]">
            <p className="text-sm font-semibold text-[#1a1a1a] truncate">
              {user.display_name || "User"}
            </p>
            <p className="text-xs text-[#6b6560] truncate">{user.email}</p>
          </div>

          {/* Navigation */}
          <div className="py-1 border-b border-[#e8e6e3]">
            {!(user.is_pro_seller && FEATURE_FLAGS.DEALERS) && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#666] hover:bg-[#faf9f7] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#8a8280]" />
                {tDash("nav.overview")}
              </Link>
            )}
            {user.is_pro_seller && FEATURE_FLAGS.DEALERS && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#666] hover:bg-[#faf9f7] transition-colors"
              >
                <Store className="w-4 h-4 text-[#8E7A6B]" />
                My Shop
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#666] hover:bg-[#faf9f7] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#8a8280]" />
              {tDash("nav.settings")}
            </Link>
          </div>

          {/* Language switcher — feature flagged until i18n is ready for release */}
          {FEATURE_FLAGS.LANGUAGE_SWITCHER && (
            <div className="px-4 py-2.5 border-b border-[#e8e6e3]">
              <p className="text-xs font-medium text-[#8a8280] mb-2 uppercase tracking-wide">
                Language
              </p>
              <div className="flex gap-1.5">
                {(
                  [
                    { code: "en", label: "English" },
                    { code: "el", label: "Ελληνικά" },
                    { code: "ru", label: "Русский" },
                  ] as const
                ).map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => switchLocale(code)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-all border ${
                      currentLocale === code
                        ? "bg-[#f0eeeb] text-[#1a1a1a] border-[#8E7A6B]"
                        : "bg-[#faf9f7] text-[#6b6560] border-[#e8e6e3] hover:border-[#e8e6e3]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sign out */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              {tAuth("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
