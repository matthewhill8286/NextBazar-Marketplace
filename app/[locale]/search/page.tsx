import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import SearchClient from "./search-client";

export const metadata: Metadata = {
  title: "Search Listings — NextBazar",
  description: "Search and browse thousands of listings on NextBazar.",
  alternates: buildAlternates("/search"),
};

export default function SearchPage() {
  return <SearchClient />;
}
