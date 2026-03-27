-- ─── NextBazar Local Seed Data ───────────────────────────────────────────────
-- Run with: supabase db reset  (applies migrations then runs this seed)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Categories ─────────────────────────────────────────────────────────────

INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Vehicles',    'vehicles',    '🚗', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Property',    'property',    '🏠', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Electronics', 'electronics', '💻', 3),
  ('a1000000-0000-0000-0000-000000000004', 'Furniture',   'furniture',   '🪑', 4),
  ('a1000000-0000-0000-0000-000000000005', 'Fashion',     'fashion',     '👗', 5),
  ('a1000000-0000-0000-0000-000000000006', 'Jobs',        'jobs',        '💼', 6),
  ('a1000000-0000-0000-0000-000000000007', 'Services',    'services',    '🔧', 7),
  ('a1000000-0000-0000-0000-000000000008', 'Sports',      'sports',      '⚽', 8)
ON CONFLICT (slug) DO NOTHING;

-- ─── Locations (Cyprus cities) ──────────────────────────────────────────────

INSERT INTO public.locations (id, name, slug, lat, lng, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Nicosia',   'nicosia',   35.1856, 33.3823, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Limassol',  'limassol',  34.6786, 33.0413, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Larnaca',   'larnaca',   34.9003, 33.6232, 3),
  ('c1000000-0000-0000-0000-000000000004', 'Paphos',    'paphos',    34.7754, 32.4218, 4),
  ('c1000000-0000-0000-0000-000000000005', 'Famagusta', 'famagusta', 35.1174, 33.9415, 5),
  ('c1000000-0000-0000-0000-000000000006', 'Kyrenia',   'kyrenia',   35.3364, 33.3182, 6)
ON CONFLICT (slug) DO NOTHING;

-- ─── Subcategories ──────────────────────────────────────────────────────────

INSERT INTO public.subcategories (id, category_id, name, slug, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Cars',              'cars',              1),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Motorcycles',       'motorcycles',       2),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Trucks & Vans',     'trucks-vans',       3),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Parts & Accessories','parts-accessories', 4),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Boats',             'boats',             5),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', 'For Sale',            'for-sale',            1),
  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000002', 'For Rent',            'for-rent',            2),
  ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000002', 'Land',                'land',                3),
  ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000002', 'Commercial',          'commercial',          4),
  ('b1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000002', 'New Developments',    'new-developments',    5),
  ('b1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000003', 'Phones & Tablets',  'phones-tablets',    1),
  ('b1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000003', 'Computers',         'computers',         2),
  ('b1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000003', 'Gaming',            'gaming',            3),
  ('b1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000003', 'TV & Audio',        'tv-audio',          4),
  ('b1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000003', 'Cameras',           'cameras',           5),
  ('b1000000-0000-0000-0000-000000000030', 'a1000000-0000-0000-0000-000000000004', 'Living Room',       'living-room',       1),
  ('b1000000-0000-0000-0000-000000000031', 'a1000000-0000-0000-0000-000000000004', 'Bedroom',           'bedroom',           2),
  ('b1000000-0000-0000-0000-000000000032', 'a1000000-0000-0000-0000-000000000004', 'Office',            'office',            3),
  ('b1000000-0000-0000-0000-000000000033', 'a1000000-0000-0000-0000-000000000004', 'Kitchen & Dining',  'kitchen-dining',    4),
  ('b1000000-0000-0000-0000-000000000034', 'a1000000-0000-0000-0000-000000000004', 'Outdoor',           'outdoor',           5),
  ('b1000000-0000-0000-0000-000000000040', 'a1000000-0000-0000-0000-000000000005', 'Men',               'men',               1),
  ('b1000000-0000-0000-0000-000000000041', 'a1000000-0000-0000-0000-000000000005', 'Women',             'women',             2),
  ('b1000000-0000-0000-0000-000000000042', 'a1000000-0000-0000-0000-000000000005', 'Kids',              'kids',              3),
  ('b1000000-0000-0000-0000-000000000043', 'a1000000-0000-0000-0000-000000000005', 'Shoes',             'shoes',             4),
  ('b1000000-0000-0000-0000-000000000044', 'a1000000-0000-0000-0000-000000000005', 'Accessories',       'accessories',       5),
  ('b1000000-0000-0000-0000-000000000050', 'a1000000-0000-0000-0000-000000000008', 'Fitness',           'fitness',           1),
  ('b1000000-0000-0000-0000-000000000051', 'a1000000-0000-0000-0000-000000000008', 'Cycling',           'cycling',           2),
  ('b1000000-0000-0000-0000-000000000052', 'a1000000-0000-0000-0000-000000000008', 'Water Sports',      'water-sports',      3),
  ('b1000000-0000-0000-0000-000000000053', 'a1000000-0000-0000-0000-000000000008', 'Team Sports',       'team-sports',       4),
  ('b1000000-0000-0000-0000-000000000054', 'a1000000-0000-0000-0000-000000000008', 'Outdoor & Camping', 'outdoor-camping',   5)
ON CONFLICT (id) DO NOTHING;

-- ─── Pricing Plans ──────────────────────────────────────────────────────────

INSERT INTO public.pricing (id, key, name, description, amount, currency, interval, duration_days, is_active, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'featured',   'Featured Listing', 'Pin your listing to the top of search results',     500, 'EUR', 'one_time', 7,  true, 1),
  ('d1000000-0000-0000-0000-000000000002', 'urgent',     'Urgent Tag',       'Add an urgent badge to attract faster responses',    300, 'EUR', 'one_time', 3,  true, 2),
  ('d1000000-0000-0000-0000-000000000003', 'dealer_pro', 'Dealer Pro',       'Professional dealer shop with branding and analytics', 2500, 'EUR', 'monthly', 30, true, 3)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage Buckets ────────────────────────────────────────────────────────
-- Local Supabase manages storage buckets itself — use DO block so failure is silent

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true) ON CONFLICT (id) DO NOTHING;
  INSERT INTO storage.buckets (id, name, public) VALUES ('avatars',  'avatars',  true) ON CONFLICT (id) DO NOTHING;
  INSERT INTO storage.buckets (id, name, public) VALUES ('shops',    'shops',    true) ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage buckets skipped (managed by local Supabase): %', SQLERRM;
END;
$$;
