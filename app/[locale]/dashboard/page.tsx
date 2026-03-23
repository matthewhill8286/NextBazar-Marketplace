"use client";

import {
  ArrowRight,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Package,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("listings")
        .select(`*, categories(name, slug, icon), locations(name, slug)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setListings(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const totalViews = listings.reduce((s, l) => s + (l.view_count || 0), 0);
  const totalFavs = listings.reduce((s, l) => s + (l.favorite_count || 0), 0);
  const totalMessages = listings.reduce(
    (s, l) => s + (l.message_count || 0),
    0,
  );

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function formatPrice(p: number | null, c: string) {
    if (!p) return "Contact";
    return `${c === "EUR" ? "€" : c}${p.toLocaleString()}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/post"
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {listings.filter((l) => l.status === "active").length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Views</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalViews.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-medium text-gray-500">Saves</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalFavs.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MessageCircle className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Messages</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalMessages}
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Your Listings</h2>
          {listings.length > 0 && (
            <Link
              href="/dashboard/listings"
              className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {listings.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  {listing.primary_image_url ? (
                    <Image
                      src={listing.primary_image_url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="font-medium text-gray-900 text-sm hover:text-indigo-600 truncate block"
                  >
                    {listing.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span>{listing.categories?.name}</span>
                    <span>·</span>
                    <span>{timeAgo(listing.created_at)}</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 shrink-0">
                  {formatPrice(listing.price, listing.currency)}
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {listing.view_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {listing.favorite_count || 0}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                    listing.status === "active"
                      ? "bg-green-50 text-green-700"
                      : listing.status === "sold"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {listing.status.charAt(0).toUpperCase() +
                    listing.status.slice(1)}
                </span>
                <Link
                  href={`/dashboard/edit/${listing.id}`}
                  className="text-xs text-indigo-600 font-medium hover:underline shrink-0"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">
              No listings yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Post your first ad and start selling
            </p>
            <Link
              href="/post"
              className="inline-flex bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Post an Ad
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
