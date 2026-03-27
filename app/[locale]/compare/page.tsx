"use client";

import { ArrowLeft, Check, ExternalLink, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CONDITION_LABELS } from "@/lib/format-helpers";
import { createClient } from "@/lib/supabase/client";

type CompareListing = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  primary_image_url: string | null;
  condition: string | null;
  description: string | null;
  is_promoted: boolean;
  is_urgent: boolean;
  view_count: number;
  created_at: string;
  categories: { name: string; slug: string; icon: string } | null;
  locations: { name: string; slug: string } | null;
};

function ConditionDot({ condition }: { condition: string | null }) {
  const colors: Record<string, string> = {
    new: "bg-emerald-500",
    like_new: "bg-green-400",
    good: "bg-amber-400",
    fair: "bg-orange-400",
    for_parts: "bg-red-400",
  };
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${colors[condition ?? ""] ?? "bg-gray-300"}`}
      />
      {CONDITION_LABELS[condition ?? ""] ?? "—"}
    </span>
  );
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 3);

  const [listings, setListings] = useState<CompareListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    supabase
      .from("listings")
      .select(
        "id, slug, title, price, currency, primary_image_url, condition, description, is_promoted, is_urgent, view_count, created_at, categories(name, slug, icon), locations(name, slug)",
      )
      .in("id", ids)
      .then(({ data }) => {
        if (!data) {
          setLoading(false);
          return;
        }
        // Preserve the order of the URL ids and unwrap Supabase join arrays
        const sorted = ids
          .map((id) => data.find((l) => l.id === id))
          .filter((l): l is NonNullable<typeof l> => Boolean(l))
          .map((l) => ({
            ...l,
            categories: Array.isArray(l.categories)
              ? (l.categories[0] ?? null)
              : l.categories,
            locations: Array.isArray(l.locations)
              ? (l.locations[0] ?? null)
              : l.locations,
          })) as CompareListing[];
        setListings(sorted);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remove(id: string) {
    const remaining = ids.filter((i) => i !== id);
    if (remaining.length === 0) {
      router.push("/search");
    } else {
      router.replace(`/compare?ids=${remaining.join(",")}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  }

  const rows: {
    label: string;
    render: (l: CompareListing) => React.ReactNode;
  }[] = [
    {
      label: "Price",
      render: (l) => {
        const sym = l.currency === "EUR" ? "€" : l.currency;
        return l.price ? (
          <span className="font-bold text-gray-900">
            {sym}
            {l.price.toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-400">POA</span>
        );
      },
    },
    {
      label: "Condition",
      render: (l) => <ConditionDot condition={l.condition} />,
    },
    {
      label: "Category",
      render: (l) => l.categories?.name ?? "—",
    },
    {
      label: "Location",
      render: (l) => l.locations?.name ?? "—",
    },
    {
      label: "Badges",
      render: (l) => (
        <span className="flex flex-wrap gap-1">
          {l.is_promoted && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ✨ Featured
            </span>
          )}
          {l.is_urgent && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              ⚡ Boosted
            </span>
          )}
          {!l.is_promoted && !l.is_urgent && (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </span>
      ),
    },
    {
      label: "Views",
      render: (l) => l.view_count.toLocaleString(),
    },
    {
      label: "Listed",
      render: (l) =>
        new Date(l.created_at).toLocaleDateString("en-IE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      label: "Description",
      render: (l) =>
        l.description ? (
          <p className="text-xs text-gray-600 line-clamp-4">{l.description}</p>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Side-by-side comparison of up to 3 listings
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : listings.length < 2 ? (
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">
            Select at least 2 listings to compare.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Row label column */}
                <th className="w-32 text-left" />

                {listings.map((l) => (
                  <th key={l.id} className="pb-6 px-3 align-top">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      {/* Image */}
                      <div className="relative aspect-video bg-gray-100">
                        {l.primary_image_url ? (
                          <Image
                            src={l.primary_image_url}
                            alt={l.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            📦
                          </div>
                        )}
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-white transition-colors shadow-sm"
                          aria-label="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title + link */}
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2 text-left">
                          {l.title}
                        </p>
                        <Link
                          href={`/listing/${l.slug}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1.5 transition-colors"
                        >
                          View listing <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}

                {/* Empty slot filler(s) for layout stability */}
                {listings.length < 3 &&
                  Array.from({ length: 3 - listings.length }).map((_, i) => (
                    <th key={`empty-${i}`} className="pb-6 px-3 align-top">
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 aspect-video flex items-center justify-center">
                        <p className="text-xs text-gray-400 text-center px-2">
                          Add another listing
                          <br />
                          to compare
                        </p>
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {rows.map(({ label, render }, ri) => (
                <tr
                  key={label}
                  className={ri % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide align-top whitespace-nowrap">
                    {label}
                  </td>
                  {listings.map((l) => (
                    <td
                      key={l.id}
                      className="py-3 px-3 text-sm text-gray-700 align-top"
                    >
                      {render(l)}
                    </td>
                  ))}
                  {listings.length < 3 &&
                    Array.from({ length: 3 - listings.length }).map((_, i) => (
                      <td key={`empty-${i}`} className="py-3 px-3" />
                    ))}
                </tr>
              ))}

              {/* CTA row */}
              <tr className="bg-white">
                <td />
                {listings.map((l) => {
                  const sym = l.currency === "EUR" ? "€" : l.currency;
                  return (
                    <td key={l.id} className="py-4 px-3">
                      <Link
                        href={`/listing/${l.slug}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        {l.price
                          ? `Buy for ${sym}${l.price.toLocaleString()}`
                          : "View listing"}
                      </Link>
                    </td>
                  );
                })}
                {listings.length < 3 &&
                  Array.from({ length: 3 - listings.length }).map((_, i) => (
                    <td key={`empty-${i}`} />
                  ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
