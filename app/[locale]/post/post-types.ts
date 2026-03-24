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
};

export type { UploadedImage, UploadedVideo };
