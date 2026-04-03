import type { ReactNode } from "react";
import "./globals.css";

// Root layout — just the HTML/body shell.
// All UIs (Navbar, Footer, providers) lives in app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
