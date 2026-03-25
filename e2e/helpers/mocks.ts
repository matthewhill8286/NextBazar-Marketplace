import type { Page, Route } from "@playwright/test";

const SUPABASE_URL = "https://giseotbdmhdsxgjilrqk.supabase.co";

// ─── Fixture data ────────────────────────────────────────────────────────────

export const mockListings = [
  {
    id: "listing-1",
    slug: "iphone-14-pro-nicosia",
    title: "iPhone 14 Pro",
    description: "Excellent condition, comes with original box and charger.",
    price: 800,
    currency: "EUR",
    price_type: "fixed",
    condition: "used_good",
    status: "active",
    is_promoted: false,
    is_urgent: false,
    primary_image_url: null,
    view_count: 42,
    favorite_count: 5,
    user_id: "user-seller-1",
    category_id: "cat-electronics",
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    contact_phone: "+35799000001",
    video_url: null,
    categories: { name: "Electronics", slug: "electronics", icon: "📱" },
    locations: { name: "Nicosia", slug: "nicosia" },
    profiles: {
      id: "user-seller-1",
      display_name: "John Doe",
      avatar_url: null,
      verified: true,
      rating: 4.8,
      total_reviews: 23,
      is_dealer: false,
      created_at: "2023-01-01T00:00:00Z",
      whatsapp_number: "+35799000001",
      telegram_username: null,
    },
    listing_images: [],
  },
  {
    id: "listing-2",
    slug: "macbook-pro-limassol",
    title: 'MacBook Pro 14" M2',
    description: "Used for 6 months, perfect working condition.",
    price: 1500,
    currency: "EUR",
    price_type: "negotiable",
    condition: "like_new",
    status: "active",
    is_promoted: true,
    is_urgent: false,
    primary_image_url: null,
    view_count: 120,
    favorite_count: 18,
    user_id: "user-seller-2",
    category_id: "cat-electronics",
    created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
    contact_phone: null,
    video_url: null,
    categories: { name: "Electronics", slug: "electronics", icon: "📱" },
    locations: { name: "Limassol", slug: "limassol" },
    profiles: {
      id: "user-seller-2",
      display_name: "Maria Smith",
      avatar_url: null,
      verified: false,
      rating: 4.2,
      total_reviews: 7,
      is_dealer: false,
      created_at: "2023-06-01T00:00:00Z",
      whatsapp_number: null,
      telegram_username: "mariasmith",
    },
    listing_images: [],
  },
];

export const mockCategories = [
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    icon: "📱",
  },
  { id: "cat-vehicles", name: "Vehicles", slug: "vehicles", icon: "🚗" },
  { id: "cat-fashion", name: "Fashion", slug: "fashion", icon: "👗" },
  { id: "cat-home", name: "Home & Garden", slug: "home-garden", icon: "🏡" },
];

export const mockLocations = [
  { id: "loc-nicosia", name: "Nicosia", slug: "nicosia" },
  { id: "loc-limassol", name: "Limassol", slug: "limassol" },
  { id: "loc-larnaca", name: "Larnaca", slug: "larnaca" },
];

// ─── Mock interceptors ────────────────────────────────────────────────────────

/** Intercept all Supabase REST API calls and return mock data */
export async function mockSupabase(page: Page) {
  // ── /api/search — server-side route used by the search page ───────────────
  // Must be mocked at the Next.js route level because the handler calls
  // Supabase server-side (not through the browser), so Supabase URL interception
  // alone won't cover it.
  await page.route("**/api/search**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hits: mockListings,
        totalHits: mockListings.length,
        source: "browse",
      }),
    }),
  );

  // ── /api/ai/search — block AI search so it never fires in tests ───────────
  await page.route("**/api/ai/search**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ filters: {} }),
    }),
  );

  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route: Route) => {
    const url = route.request().url();

    // Categories
    if (url.includes("/rest/v1/categories")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCategories),
      });
    }

    // Locations
    if (url.includes("/rest/v1/locations")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockLocations),
      });
    }

    // Favorites — table is called "favorites", not "listing_favorites"
    if (url.includes("/rest/v1/favorites")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
        headers: { "Content-Range": "0-0/0" },
      });
    }

    // Single listing by slug
    if (url.includes("/rest/v1/listings") && url.includes("slug=eq.")) {
      const slug = url.match(/slug=eq\.([^&]+)/)?.[1];
      const listing = mockListings.find(
        (l) => l.slug === decodeURIComponent(slug ?? ""),
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(listing ?? null),
      });
    }

    // Listings list
    if (url.includes("/rest/v1/listings")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockListings),
        headers: { "Content-Range": `0-1/${mockListings.length}` },
      });
    }

    // Notifications — empty by default
    if (url.includes("/rest/v1/notifications")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
        headers: { "Content-Range": "0-0/0" },
      });
    }

    // Profiles — return a stub (needed by DashboardShell)
    if (url.includes("/rest/v1/profiles")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "user-test-1",
            display_name: "Test User",
            avatar_url: null,
            verified: false,
            is_dealer: false,
            rating: 0,
            total_reviews: 0,
          },
        ]),
        headers: { "Content-Range": "0-0/1" },
      });
    }

    // Auth — no user signed in
    if (url.includes("/auth/v1/user")) {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "JWT expired" }),
      });
    }

    // Fallthrough — let real requests through (fonts, etc.)
    return route.continue();
  });

  // Block realtime websocket connections so tests don't hang
  await page.route(`${SUPABASE_URL}/realtime/**`, (route) => route.abort());
}

/** Mock a signed-in user session.
 *
 * @supabase/ssr's createBrowserClient reads auth state from document.cookie
 * (not localStorage). The cookie value must be in the format:
 *   "base64url-" + base64url(JSON.stringify(session))
 *
 * We also mock the network endpoints that getUser() calls to validate the JWT,
 * and the token-refresh endpoint in case the client tries to refresh.
 */
export async function mockAuthUser(page: Page, userId = "user-test-1") {
  const fakeUser = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    app_metadata: { provider: "email" },
    user_metadata: { display_name: "Test User" },
    created_at: "2024-01-01T00:00:00Z",
  };
  const fakeTokenResponse = {
    access_token: "fake-access-token",
    refresh_token: "fake-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: fakeUser,
  };

  // Intercept token refresh (POST /auth/v1/token?grant_type=*)
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fakeTokenResponse),
    }),
  );

  // Intercept getUser validation (GET /auth/v1/user)
  await page.route(`${SUPABASE_URL}/auth/v1/user**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fakeUser),
    }),
  );

  // Set a cookie in the format @supabase/ssr createBrowserClient expects:
  //   name  = sb-{project_ref}-auth-token
  //   value = "base64url-" + base64url( JSON.stringify(session) )
  //
  // @supabase/ssr reads document.cookie via the `cookie` package (no URL decoding
  // by default in newer versions), so we set the raw encoded value.
  await page.addInitScript(
    ({ id }) => {
      const session = {
        access_token: "fake-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "fake-refresh-token",
        user: {
          id,
          aud: "authenticated",
          role: "authenticated",
          email: "test@example.com",
          app_metadata: { provider: "email" },
          user_metadata: {},
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      // @supabase/ssr uses the prefix "base64-" (not "base64url-") and then
      // decodes the remainder with its own stringFromBase64URL implementation.
      // btoa is safe here because the JSON contains only ASCII characters.
      const json = JSON.stringify(session);
      const b64 = btoa(json)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      const cookieValue = `base64-${b64}`;
      const cookieName = "sb-giseotbdmhdsxgjilrqk-auth-token";

      // biome-ignore lint/suspicious/noDocumentCookie: seems fine here
      document.cookie = `${cookieName}=${cookieValue}; path=/; max-age=3600; SameSite=Lax`;

      // Also keep the legacy localStorage key as a fallback for any code that reads it
      localStorage.setItem(cookieName, JSON.stringify(session));
    },
    { id: userId },
  );
}
