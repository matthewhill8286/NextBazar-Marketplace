"use client";

import { Bot, MessageCircle, Search, Shield, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/app/components/listing-card";
import GlobalSearchBar from "@/app/components/global-search-bar";

const LISTING_SELECT = `
  *,
  categories(name, slug, icon),
  locations(name, slug),
  profiles!listings_user_id_fkey(display_name, avatar_url, verified, rating, total_reviews)
`;

export default function HomeClient() {
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const [
        { data: cats },
        { data: feat },
        { data: rec },
        { count },
        { data: { user } },
      ] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("listings").select(LISTING_SELECT).eq("status", "active").eq("is_promoted", true).order("created_at", { ascending: false }).limit(4),
        supabase.from("listings").select(LISTING_SELECT).eq("status", "active").order("created_at", { ascending: false }).limit(8),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.auth.getUser(),
      ]);

      setCategories(cats || []);
      setFeatured(feat || []);
      setRecent(rec || []);
      setTotalCount(count || 0);

      if (user) {
        setUserId(user.id);
        const { data: favs } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id);
        if (favs) setSavedIds(new Set(favs.map((f: any) => f.listing_id)));
      }

      setLoading(false);
    }
    load();
  }, [supabase.from, supabase.auth.getUser]);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
        {/* Dot mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Ambient glow blobs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-25 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Cyprus&rsquo;s smartest marketplace
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-[1.1]">
            Buy &amp; Sell{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-orange-300">
                Anything
              </span>
            </span>{" "}
            in Cyprus
          </h1>

          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered search, instant messaging, and verified sellers — all in one place.
          </p>

          {/* Stats chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: TrendingUp, label: `${totalCount.toLocaleString()}+ Active Listings` },
              { icon: Shield, label: "Verified Sellers" },
              { icon: Bot, label: "AI-Powered" },
              { icon: MessageCircle, label: "Real-time Chat" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-full text-sm text-white/90 font-medium">
                <Icon className="w-3.5 h-3.5 text-blue-200" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Categories ──────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-sm text-gray-400 mt-0.5">Find exactly what you&rsquo;re looking for</p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {categories.map((cat, i) => {
                const palettes = [
                  "from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-100",
                  "from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-100",
                  "from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-100",
                  "from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-rose-100",
                  "from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-violet-100",
                  "from-cyan-50 to-sky-50 hover:from-cyan-100 hover:to-sky-100 border-cyan-100",
                  "from-lime-50 to-green-50 hover:from-lime-100 hover:to-green-100 border-lime-100",
                  "from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-100",
                ];
                return (
                  <Link
                    key={cat.id}
                    href={`/search?category=${cat.slug}`}
                    className={`bg-gradient-to-br ${palettes[i % palettes.length]} rounded-2xl p-3 border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center group`}
                  >
                    <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-200">
                      {cat.icon}
                    </div>
                    <div className="text-xs font-semibold text-gray-700 leading-tight">{cat.name}</div>
                    {cat.listing_count > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{cat.listing_count.toLocaleString()}</div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Featured Listings ────────────────────────────────────────── */}
        {!loading && featured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                <h2 className="text-xl font-bold text-gray-900">Featured Listings</h2>
                <span className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Promoted
                </span>
              </div>
              <Link href="/search" className="text-sm text-blue-600 font-semibold hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} userId={userId} isSaved={savedIds.has(listing.id)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Added ───────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">
                {!loading && recent.length === 0 ? "No listings yet" : "Recently Added"}
              </h2>
            </div>
            {recent.length > 0 && (
              <Link href="/search" className="text-sm text-blue-600 font-semibold hover:underline">
                View all →
              </Link>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="aspect-4/3 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                    <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((listing) => (
                <ListingCard key={listing.id} listing={listing} userId={userId} isSaved={savedIds.has(listing.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Be the first to post!</h3>
              <p className="text-gray-400 mb-6">The marketplace is waiting for listings</p>
              <Link href="/post" className="inline-flex bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200">
                Post Your First Ad
              </Link>
            </div>
          )}
        </section>

        {/* ── Why NextBazar ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white mb-4">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
          />
          <div className="relative">
            <div className="text-center mb-10">
              <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">Why NextBazar</p>
              <h2 className="text-2xl md:text-3xl font-bold">The smarter way to trade</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Bot, color: "from-blue-500 to-indigo-600", title: "AI-Powered Listings", desc: "Upload photos and let AI auto-fill your listing details. Get smart pricing suggestions based on live market data." },
                { icon: Shield, color: "from-emerald-500 to-teal-600", title: "Trust & Safety", desc: "Verified sellers, user reviews, and AI-powered spam detection keep the marketplace safe and trustworthy." },
                { icon: MessageCircle, color: "from-violet-500 to-purple-600", title: "Instant Communication", desc: "Real-time messaging, instant notifications, and secure in-app communication between buyers and sellers." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="text-center group">
                  <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/post" className="bg-linear-to-r from-blue-500 to-indigo-600 text-white px-7 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-900/30">
                Post a Free Ad
              </Link>
              <Link href="/search" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-7 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors">
                Browse Listings
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
