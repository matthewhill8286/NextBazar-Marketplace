import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Listings | NextBazar",
  description:
    "Compare multiple listings side-by-side to make informed buying decisions on NextBazar.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
