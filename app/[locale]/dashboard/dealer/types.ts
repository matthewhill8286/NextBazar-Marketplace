export type ListingRow = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  status: string;
  view_count: number;
  favorite_count: number;
  message_count: number;
  primary_image_url: string | null;
  created_at: string;
  is_promoted: boolean;
};
