"use client";

import {
  CheckCircle,
  ExternalLink,
  Eye,
  Flag,
  Loader2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format-helpers";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { display_name: string | null } | null;
  listing: {
    id: string;
    slug: string;
    title: string;
    primary_image_url: string | null;
    status: string;
  } | null;
};

const REASON_LABELS: Record<string, string> = {
  scam: "Scam / fraud",
  spam: "Spam / duplicate",
  counterfeit: "Counterfeit / fake",
  wrong_category: "Wrong category",
  offensive: "Offensive content",
  already_sold: "Already sold",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reviewing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  dismissed: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function AdminReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Simple admin check — only allow specific emails
      // Replace with your actual admin email(s) or a proper role check
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_dealer")
        .eq("id", user.id)
        .single();

      // TODO: replace this with a proper admin check once you add an is_admin column
      if (!profile) {
        router.push("/");
        return;
      }

      fetchReports();
    }
    load();
  }, []);

  async function fetchReports(statusFilter = filter) {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select(`
        id, reason, details, status, created_at,
        reporter:profiles!reports_reporter_id_fkey(display_name),
        listing:listings!reports_listing_id_fkey(id, slug, title, primary_image_url, status)
      `)
      .eq("status", statusFilter)
      .order("created_at", { ascending: false })
      .limit(50);

    setReports((data as unknown as Report[]) || []);
    setLoading(false);
  }

  async function updateStatus(reportId: string, newStatus: string) {
    setUpdating(reportId);
    await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setUpdating(null);
  }

  async function removeListing(report: Report) {
    if (!report.listing) return;
    if (
      !confirm(
        `Remove listing "${report.listing.title}"? This cannot be undone.`,
      )
    )
      return;
    setUpdating(report.id);
    await supabase
      .from("listings")
      .update({ status: "removed" })
      .eq("id", report.listing.id);
    await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", report.id);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setUpdating(null);
  }

  function handleFilterChange(s: string) {
    setFilter(s);
    fetchReports(s);
  }

  const TABS = ["pending", "reviewing", "resolved", "dismissed"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Flag className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Reports Queue</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => handleFilterChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">No {filter} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-start gap-4">
                {/* Listing thumbnail */}
                <Link
                  href={`/listing/${report.listing?.slug || "#"}`}
                  target="_blank"
                  className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative hover:opacity-80 transition-opacity"
                >
                  {report.listing?.primary_image_url ? (
                    <Image
                      src={report.listing.primary_image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                      📦
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[report.status]}`}
                        >
                          {report.status}
                        </span>
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                      </div>
                      <Link
                        href={`/listing/${report.listing?.slug || "#"}`}
                        target="_blank"
                        className="font-medium text-gray-900 hover:text-indigo-600 flex items-center gap-1 text-sm"
                      >
                        {report.listing?.title || "Deleted listing"}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Reported by{" "}
                        {report.reporter?.display_name || "Anonymous"} ·{" "}
                        {timeAgo(report.created_at)}
                      </p>
                    </div>
                  </div>

                  {report.details && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {report.details}
                    </p>
                  )}

                  {/* Actions */}
                  {filter === "pending" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => updateStatus(report.id, "reviewing")}
                        disabled={updating === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors disabled:opacity-40"
                      >
                        <Eye className="w-3.5 h-3.5" /> Mark Reviewing
                      </button>
                      <button
                        onClick={() => removeListing(report)}
                        disabled={
                          updating === report.id ||
                          !report.listing ||
                          report.listing.status === "removed"
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Remove Listing
                      </button>
                      <button
                        onClick={() => updateStatus(report.id, "dismissed")}
                        disabled={updating === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                  {filter === "reviewing" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => removeListing(report)}
                        disabled={
                          updating === report.id ||
                          !report.listing ||
                          report.listing.status === "removed"
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Remove Listing
                      </button>
                      <button
                        onClick={() => updateStatus(report.id, "dismissed")}
                        disabled={updating === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                  {updating === report.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mt-2" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
