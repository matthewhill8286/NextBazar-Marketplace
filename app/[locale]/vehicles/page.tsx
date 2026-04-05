import type { Metadata } from "next";
import VehiclesClient from "./vehicles-client";

export const metadata: Metadata = {
  title: "Cars & Vehicles for Sale in Cyprus — NextBazar",
  description:
    "Browse new and used cars, motorcycles, and commercial vehicles from private sellers and Pro Sellers across Cyprus.",
};

export default function VehiclesPage() {
  return <VehiclesClient />;
}
