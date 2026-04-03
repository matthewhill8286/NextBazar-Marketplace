import type { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing — NextBazar",
  description:
    "Simple, transparent pricing for sellers, buyers, and listing promotions on NextBazar.",
};

export default function PricingPage() {
  return <PricingClient />;
}
