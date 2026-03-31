import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | NextBazar",
  description:
    "View and manage your conversations with buyers and sellers on NextBazar.",
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
