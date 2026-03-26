# 🏪 NextBazar — Modern Classifieds Marketplace

## Architecture Blueprint & Technical Plan

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14+ (App Router) | SSR for SEO, React Server Components, edge-fast |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid, consistent, beautiful UI |
| **Backend/DB** | Supabase (Postgres) | Auth, real-time, storage, RLS — all-in-one |
| **Search** | Supabase full-text → Meilisearch | Start simple, scale to instant typo-tolerant search |
| **Payments** | Stripe | Promoted listings, dealer subscriptions, escrow |
| **Hosting** | Vercel | Edge deployment, instant previews, analytics |
| **Maps** | Mapbox GL JS | Location search, radius filtering, interactive maps |
| **Images** | Supabase Storage + Vercel OG | Upload, transform, optimize on the fly |
| **AI** | OpenAI / Anthropic APIs | Auto-categorize, smart pricing, spam detection |
| **Real-time** | Supabase Realtime | Live chat, instant notifications |
| **Mobile** | React Native (Expo) or PWA | Phase 2: native apps sharing logic with web |

---

## Database Schema (Supabase / Postgres)

### Core Tables

```sql
-- Users extend Supabase auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  phone text,
  location_id uuid references locations(id),
  bio text,
  is_pro_seller boolean default false,
  rating numeric(3,2) default 0,
  total_reviews int default 0,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories with hierarchy (e.g. Vehicles > Cars > SUVs)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id),
  icon text, -- lucide icon name
  sort_order int default 0,
  listing_count int default 0
);

-- Locations (cities, areas, districts)
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references locations(id),
  lat numeric(10,7),
  lng numeric(10,7),
  level text check (level in ('country','region','city','district'))
);

-- The main listings table
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id),
  location_id uuid references locations(id),

  title text not null,
  slug text unique not null,
  description text,
  price numeric(12,2),
  currency text default 'EUR',
  price_type text check (price_type in ('fixed','negotiable','free','contact','auction')),

  condition text check (condition in ('new','like_new','good','fair','for_parts')),
  status text default 'active' check (status in ('draft','active','sold','expired','removed')),

  -- Denormalized for fast queries
  primary_image_url text,
  image_count int default 0,

  -- AI-generated
  auto_category_suggestion uuid references categories(id),
  price_suggestion numeric(12,2),
  quality_score int, -- 0-100

  -- Promotion
  is_promoted boolean default false,
  promoted_until timestamptz,
  is_urgent boolean default false,

  -- Search
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored,

  -- Engagement
  view_count int default 0,
  favorite_count int default 0,
  message_count int default 0,

  -- Custom attributes (flexible schema for category-specific fields)
  attributes jsonb default '{}',

  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Full-text search index
create index idx_listings_search on listings using gin(search_vector);
create index idx_listings_category on listings(category_id) where status = 'active';
create index idx_listings_location on listings(location_id) where status = 'active';
create index idx_listings_price on listings(price) where status = 'active';
create index idx_listings_created on listings(created_at desc) where status = 'active';

-- Listing images
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  thumbnail_url text,
  sort_order int default 0,
  width int,
  height int,
  created_at timestamptz default now()
);

-- Favorites / Saved listings
create table public.favorites (
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

-- Real-time messaging
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete set null,
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references profiles(id),
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Reviews & ratings
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references profiles(id),
  reviewed_id uuid not null references profiles(id),
  listing_id uuid references listings(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Reports (trust & safety)
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  listing_id uuid references listings(id),
  user_id uuid references profiles(id),
  reason text not null,
  details text,
  status text default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  created_at timestamptz default now()
);
```

### Row-Level Security (RLS) Policies

```sql
-- Listings: anyone can read active, owners can edit their own
alter table listings enable row level security;

create policy "Active listings are public"
  on listings for select using (status = 'active');

create policy "Users can manage own listings"
  on listings for all using (auth.uid() = user_id);

-- Messages: only conversation participants can read
alter table messages enable row level security;

create policy "Conversation participants can read messages"
  on messages for select using (
    conversation_id in (
      select id from conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );
```

---

## Key Features & What Makes It Better Than Bazaraki

### 1. Instant Search with Filters
- Typo-tolerant, as-you-type search
- Faceted filters (price, location, condition, date)
- Saved searches with email/push alerts

### 2. AI-Powered Listings
- Upload photos → auto-fill title, category, description
- Smart price suggestion based on similar items
- Quality score that rewards well-crafted listings

### 3. Trust & Safety
- Verified users (phone, email, ID)
- Seller ratings & reviews
- AI spam/scam detection
- In-app messaging (no exposed phone numbers by default)

### 4. Real-Time Everything
- Live chat between buyers and sellers
- Instant notifications (new messages, price drops, saved search matches)
- Live view counts on your listings

### 5. Map-Based Browsing
- Browse listings on a map
- "Near me" radius search
- District/neighborhood filtering

### 6. Dealer/Pro Accounts
- Shop pages with branding
- Bulk listing management
- Analytics dashboard
- Promoted listings & featured placement
- Stripe subscription billing

### 7. Mobile-First PWA
- Installable on any device
- Offline browsing of saved listings
- Camera integration for quick listing creation

---

## Project Structure (Next.js)

```
nextbazar/
├── app/
│   ├── layout.tsx              # Root layout with nav, footer
│   ├── page.tsx                # Homepage: hero, search, categories, featured
│   ├── search/page.tsx         # Search results with filters
│   ├── category/[slug]/page.tsx # Category listing page
│   ├── listing/[slug]/page.tsx  # Listing detail page
│   ├── listing/new/page.tsx     # Create listing form
│   ├── messages/page.tsx        # Conversations inbox
│   ├── messages/[id]/page.tsx   # Chat thread
│   ├── profile/[username]/page.tsx # Public profile
│   ├── dashboard/               # Seller dashboard
│   │   ├── listings/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   └── api/                     # API routes
│       ├── listings/route.ts
│       ├── search/route.ts
│       └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                      # shadcn components
│   ├── listing-card.tsx
│   ├── search-bar.tsx
│   ├── category-grid.tsx
│   ├── image-gallery.tsx
│   ├── chat-widget.tsx
│   └── map-view.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── stripe.ts
│   └── ai.ts
└── supabase/
    └── migrations/              # Database migrations
```

---

## Development Phases

### Phase 1: Core MVP (4-6 weeks)
- Auth (email, Google, phone)
- CRUD listings with image upload
- Category browsing & basic search
- Listing detail pages with image gallery
- User profiles
- Favorites/saved listings

### Phase 2: Communication & Trust (2-3 weeks)
- Real-time messaging
- User reviews & ratings
- Phone verification
- Report system

### Phase 3: Monetization (2-3 weeks)
- Stripe integration
- Promoted/featured listings
- Dealer subscriptions
- Analytics dashboard

### Phase 4: Intelligence (2-3 weeks)
- AI auto-categorization
- Smart pricing suggestions
- Spam/scam detection
- Personalized recommendations
- Saved search alerts

### Phase 5: Scale & Polish (ongoing)
- Meilisearch integration
- Map-based browsing
- PWA / React Native apps
- Performance optimization
- A/B testing framework

---

## Getting Started

```bash
# Create Next.js project
npx create-next-app@latest nextbazar --typescript --tailwind --app --src-dir

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install stripe @stripe/stripe-js
npm install lucide-react recharts
npx shadcn@latest init

# Set up Supabase
npx supabase init
npx supabase db push
```

---

*This blueprint is designed to be iterated on. Start with Phase 1, ship fast, get feedback, and build from there.*
