import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Items",
  description:
    "View and manage your saved listings on NextBazar. Keep track of items you're interested in.",
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
