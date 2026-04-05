import type { Metadata } from "next";
import PropertiesClient from "./properties-client";

export const metadata: Metadata = {
  title: "Properties for Sale & Rent in Cyprus — NextBazar",
  description:
    "Browse houses, apartments, land, and commercial properties for sale and rent across Cyprus. New developments, existing builds, and rental listings.",
};

export default function PropertiesPage() {
  return <PropertiesClient />;
}
