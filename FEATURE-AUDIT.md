# NextBazar Feature Audit — Opportunity Map

> Compiled 2026-04-16 · Covers UX, backend, monetisation, SEO, performance, and DX

---

## Tier 1 — High Impact, Low-to-Medium Effort

### 1. Auth Middleware (Missing entirely)

The app has zero middleware. Every protected page performs its own auth check client-side, which means unauthenticated users briefly see dashboard chrome before being redirected, and there's no server-side request-level gating for API routes beyond ad-hoc `requireAuth()` calls.

**Introduce:** A root `middleware.ts` that reads the Supabase session cookie, sets `x-user-id` on the request headers for downstream consumption, and redirects unauthenticated users from `/dashboard/**` and `/messages/**` before the page even renders. This also lets you drop the client-side redirect boilerplate from every dashboard page.

### 2. Buyer Plan Enforcement (Designed but not wired)

The plan config defines three buyer tiers — Free, Plus (€5.99/mo), and Premium (€11.99/mo) — with features like unlimited saved searches, price alerts, ad-free browsing, and priority support. However, **none of this is enforced**. There's no `buyer_plan` column on profiles, no Stripe subscription flow for buyers, and no feature-gating in the UI.

**Introduce:** Add `buyer_plan` and `buyer_plan_expires_at` columns to profiles. Wire a Stripe Checkout flow mirroring the dealer subscription pattern. Gate saved search limits, price alert frequency, and comparison slots behind the buyer tier.

### 3. Image Optimisation Pipeline

Listing images are stored as raw URLs in Supabase Storage with no server-side processing. There's a custom image loader (`lib/supabase/image-loader.ts`) but no resizing, WebP conversion, or thumbnail generation beyond what Supabase provides by default.

**Introduce:** A Supabase Edge Function (or storage hook) that triggers on upload to generate thumbnails (400px) and optimised variants (WebP, AVIF). Update `listing_images` to store `thumbnail_url` and `optimised_url` separately. The `CARD_SELECT` already references `primary_image_url` — add a `primary_thumbnail_url` to avoid serving full-resolution images in card grids.

### 4. Third-Party Analytics / Product Analytics

No PostHog, Mixpanel, GA4, or any product analytics tool is integrated. Sentry handles error monitoring but there's no funnel tracking, user session analysis, or conversion measurement. For a marketplace, not knowing your search-to-contact rate or listing-to-sale conversion is a significant blind spot.

**Introduce:** PostHog (self-hostable, GDPR-friendly, generous free tier). Instrument key funnels: homepage → search → listing view → contact/offer, and seller onboarding → first listing → first sale. Add a `<PostHogProvider>` in the root layout.

### 5. Social Sharing

The only sharing mechanism is `navigator.share()` on shop pages (mobile-only, no fallback). Listing detail pages — the most shareable asset on any marketplace — have no share UI at all.

**Introduce:** A `<ShareButton>` component with platform-specific links (WhatsApp is critical for Cyprus market, plus Facebook, X, copy-link). Add Open Graph and Twitter Card meta tags to listing detail pages via `generateMetadata()`.

---

## Tier 2 — High Impact, Medium Effort

### 6. Seller Payout / Transaction History

There's no transaction or invoice history visible to sellers. Stripe handles payments but sellers have no in-app view of their earnings, pending payouts, or fee breakdown. The only portal access is via `/api/dealer/portal` which redirects to Stripe's hosted portal.

**Introduce:** A `/dashboard/shop/payouts` page that queries Stripe's Balance Transactions and Payouts APIs via a server component. Cache aggressively (5-min TTL). Show a summary card (available balance, pending, total earned) and a paginated transaction table.

### 7. Structured Seller Trust Indicators

The schema tracks `verified`, `rating`, `total_reviews`, and `is_pro_seller` on profiles, but the listing card and detail page don't surface these prominently. Trust signals are the #1 driver of conversion on C2C marketplaces.

**Introduce:** A `<TrustBadge>` component that renders verified checkmark, star rating, review count, and pro-seller badge in a consistent strip. Place it on listing cards, listing detail (seller section), and shop header. Add a `<SellerVerification>` flow in settings where sellers can submit ID verification.

### 8. Notification Preferences & Email Digest

The notification system inserts records for price drops, low stock, offers, and messages, but there's no user-facing preference screen. Users can't choose which notifications they receive or opt into a daily/weekly email digest.

**Introduce:** A `notification_preferences` table (user_id, channel, type, enabled). Add a `/dashboard/settings/notifications` UI. Implement a daily digest cron job that batches unread notifications into a single Resend email.

### 9. Full-Text Search Upgrade — Faceted Filters + URL State

The search page exists but filter state doesn't persist in the URL. Users can't share a filtered search result, and the back button loses their filters. The search API also lacks faceted counts (e.g., "Vehicles (42), Property (17)").

**Introduce:** Encode all filter state in URL search params (`?q=bmw&category=vehicles&condition=used_good&sort=price_low`). Add a faceted count query that returns per-category and per-condition counts alongside results. This is a major SEO win — faceted search pages become indexable landing pages.

### 10. Webhook Idempotency

Stripe and Coinbase webhooks don't track whether an event has already been processed. If Stripe retries a `checkout.session.completed` event (common during network issues), the promotion activation runs again, potentially extending the `promoted_until` date.

**Introduce:** A `webhook_events` table with `(provider, event_id)` unique constraint. At the top of each webhook handler, INSERT-OR-IGNORE the event ID. If the insert is a no-op (duplicate), return 200 immediately without processing.

---

## Tier 3 — Medium Impact, Medium-to-High Effort

### 11. Admin Panel

The only admin capability is a feature-flagged (currently disabled) reports page with email-allowlist gating. There's no way for operators to moderate listings, manage users, view platform metrics, or handle disputes without direct database access.

**Introduce:** An `/admin` route group with its own layout and middleware-level role check. Start with three pages: (1) Listings moderation queue (flag/approve/remove), (2) User management (ban, verify, view activity), (3) Platform dashboard (GMV, active users, listings created, conversion rates via Supabase aggregate queries).

### 12. Content Moderation Pipeline

No automated content moderation exists. Listing titles, descriptions, and images go live immediately with no screening. For a marketplace, this is a liability risk.

**Introduce:** A two-phase approach. Phase 1: Add an OpenAI moderation API call in the listing creation flow that flags inappropriate text content and blocks publication with a review-pending status. Phase 2: Add image moderation via a Supabase Edge Function that calls an image classification API on upload.

### 13. PWA with Offline Support

The manifest.ts exists but there's no service worker. The app is installable on mobile but provides no offline experience — network failure shows a browser error page.

**Introduce:** A service worker (via `next-pwa` or Serwist) that caches the app shell, saved listings, and recently viewed items. Show a branded offline page when the network is unavailable. Add push notification support for new messages and offer updates.

### 14. Expired Listing Re-listing Flow

Listings have `expires_at` and `status` fields, and the cron job expires offers, but there's no user-facing flow for re-listing expired items. Sellers have to manually edit and re-activate.

**Introduce:** A "Relist" button on expired listings in the inventory tab that resets `expires_at`, bumps `updated_at`, and optionally offers a discounted boost. Send a reminder email 3 days before expiry via a new cron job.

### 15. Category-Specific Attribute Schema

The `attributes` JSONB column on listings is unstructured — vehicles might store mileage while properties store square footage, but there's no schema enforcement or category-aware form rendering.

**Introduce:** A `category_attributes` table that defines the expected attributes per category (name, type, required, options for enums). Render dynamic form fields in the listing creation flow based on the selected category. This enables structured search filters (e.g., "mileage < 50,000 km").

---

## Tier 4 — Strategic / Long-Term

### 16. Multi-Currency Support

The schema has a `currency` column on listings but the UI hardcodes EUR formatting in many places. Cyprus has a significant expat and tourist population — GBP, USD, and RUB are commonly used in classified ads.

### 17. Seller Teams / Multi-User Shops

The Business tier promises "team members (up to 5)" but there's no `shop_members` table or invitation flow. This is a key differentiator for dealerships.

### 18. Review Dispute Resolution

The review modal exists but there's no way for sellers to respond to reviews, flag inappropriate ones, or for admins to moderate them. Review integrity is critical for marketplace trust.

### 19. Listing Versioning / Edit History

No audit trail exists for listing edits. For dispute resolution and trust, being able to show "price was X when you made the offer" is valuable. An `edit_history` JSONB array or a separate `listing_versions` table would address this.

### 20. AI-Powered Recommendations

The vector embedding infrastructure exists (`match_listings()` RPC with pgvector) but is only used for semantic search. It could power "You might also like" recommendations on the listing detail page, personalised homepage feeds based on viewed/saved listings, and email recommendations.

---

## Quick Wins (< 1 day each)

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| A | Breadcrumb navigation | 2 hrs | Missing entirely; add `<Breadcrumbs>` to listing detail + category pages |
| B | Structured data (JSON-LD) | 3 hrs | Add `Product`, `Offer`, `BreadcrumbList` schemas to listing pages for rich Google results |
| C | Error boundary for `/dashboard/shop/**` | 1 hr | No error.tsx in shop sub-routes; a single missing API response crashes the whole panel |
| D | Canonical URLs in `generateMetadata` | 1 hr | Prevents duplicate content penalties from locale prefixes |
| E | `robots.txt` exclusions for dashboard | 30 min | Dashboard routes should be `Disallow`'d — currently not checked |
| F | Loading state for `/dashboard/plan` | 30 min | Missing loading.tsx; plan page flashes raw HTML on slow connections |
| G | OG images for listing detail pages | 3 hrs | Dynamic OG images using `ImageResponse` with listing title + primary image |
