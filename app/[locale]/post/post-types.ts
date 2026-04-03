import type { UploadedImage } from "@/app/components/image-upload";
import type { UploadedVideo } from "@/app/components/video-upload";
import type {
  Category as SupabaseCategory,
  Location as SupabaseLocation,
  Subcategory as SupabaseSubcategory,
} from "@/lib/supabase/supabase.types";

export type Category = SupabaseCategory;
export type Subcategory = SupabaseSubcategory;
export type Location = SupabaseLocation;
export type PricingData = {
  price_low?: number;
  suggested_price?: number;
  price_high?: number;
  reasoning?: string;
  tips?: string[];
  market?: { similar_count: number };
};

export type FormData = {
  title: string;
  category_id: string;
  subcategory_id: string;
  price: string;
  price_type: string;
  description: string;
  condition: string;
  location_id: string;
  contact_phone: string;
  quantity: string;
  low_stock_threshold: string;
};

// ─── Vehicle-specific attributes (stored in listings.attributes JSON) ─────────

export type VehicleAttributes = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  color: string;
  body_type: string;
  engine_size: string;
  doors: string;
  drive_type: string;
  owners: string;
  service_history: string;
};

export const EMPTY_VEHICLE_ATTRS: VehicleAttributes = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  fuel_type: "",
  transmission: "",
  color: "",
  body_type: "",
  engine_size: "",
  doors: "",
  drive_type: "",
  owners: "",
  service_history: "",
};

// Slug of the Vehicles category — used to conditionally show vehicle fields
export const VEHICLES_CATEGORY_SLUG = "vehicles";

export type { UploadedImage, UploadedVideo };
