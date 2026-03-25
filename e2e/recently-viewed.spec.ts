import { expect, test } from "@playwright/test";
import { mockSupabase } from "./helpers/mocks";

const SUPABASE_URL = "https://giseotbdmhdsxgjilrqk.supabase.co";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seed localStorage with an array of recently-viewed listing IDs */
async function seedRecentlyViewed(
  page: Parameters<typeof mockSupabase>[0],
  ids: string[],
) {
  await page.addInitScript((storedIds) => {
    localStorage.setItem("recentlyViewed", JSON.stringify(storedIds));
  }, ids);
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Recently Viewed — tracking on listing detail page", () => {
  /** Wait until the listing detail has fully loaded (skeleton gone, title visible) */
  async function waitForListingLoad(
    page: Parameters<typeof mockSupabase>[0],
    title: string,
  ) {
    await page
      .getByText(title)
      .first()
      .waitFor({ state: "visible", timeout: 12_000 });
  }

  test("visiting a listing page stores its ID in localStorage", async ({
    page,
  }) => {
    await mockSupabase(page);
    await page.goto("/listing/iphone-14-pro-nicosia");

    // The useEffect that writes localStorage runs after the data fetch completes
    await waitForListingLoad(page, "iPhone 14 Pro");

    const stored = await page.evaluate(() =>
      localStorage.getItem("recentlyViewed"),
    );
    expect(stored).not.toBeNull();
    const ids: string[] = JSON.parse(stored!);
    expect(ids).toContain("listing-1");
  });

  test("visiting a second listing prepends it to the list", async ({
    page,
  }) => {
    await mockSupabase(page);

    await page.goto("/listing/iphone-14-pro-nicosia");
    await waitForListingLoad(page, "iPhone 14 Pro");

    await page.goto("/listing/macbook-pro-limassol");
    await waitForListingLoad(page, "MacBook Pro");

    const stored = await page.evaluate(() =>
      localStorage.getItem("recentlyViewed"),
    );
    const ids: string[] = JSON.parse(stored!);
    expect(ids[0]).toBe("listing-2");
    expect(ids).toContain("listing-1");
  });

  test("revisiting the same listing moves it to the front without duplicating", async ({
    page,
  }) => {
    await mockSupabase(page);

    await page.goto("/listing/iphone-14-pro-nicosia");
    await waitForListingLoad(page, "iPhone 14 Pro");

    await page.goto("/listing/macbook-pro-limassol");
    await waitForListingLoad(page, "MacBook Pro");

    await page.goto("/listing/iphone-14-pro-nicosia");
    await waitForListingLoad(page, "iPhone 14 Pro");

    const stored = await page.evaluate(() =>
      localStorage.getItem("recentlyViewed"),
    );
    const ids: string[] = JSON.parse(stored!);

    expect(ids[0]).toBe("listing-1");
    expect(ids.filter((id) => id === "listing-1")).toHaveLength(1);
  });
});

test.describe("Recently Viewed — home page section", () => {
  test("section is hidden when localStorage has no entries", async ({
    page,
  }) => {
    await mockSupabase(page);
    await page.goto("/");

    await expect(page.getByText("Recently Viewed")).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("section appears when localStorage has valid listing IDs", async ({
    page,
  }) => {
    await mockSupabase(page);
    // Pre-seed localStorage before the page loads
    await seedRecentlyViewed(page, ["listing-1", "listing-2"]);
    await page.goto("/");

    await expect(page.getByText("Recently Viewed")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows listing cards matching the stored IDs", async ({ page }) => {
    await mockSupabase(page);
    await seedRecentlyViewed(page, ["listing-1", "listing-2"]);
    await page.goto("/");

    // Both listing titles from mocks should be visible
    await expect(page.getByText("Recently Viewed")).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      page.getByText("iPhone 14 Pro").or(page.getByText("MacBook Pro")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("'Clear history' button removes the section", async ({ page }) => {
    await mockSupabase(page);
    await seedRecentlyViewed(page, ["listing-1"]);
    await page.goto("/");

    await expect(page.getByText("Recently Viewed")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /clear history/i }).click();

    // Section should disappear immediately (optimistic state update)
    await expect(page.getByText("Recently Viewed")).not.toBeVisible({
      timeout: 3_000,
    });

    // localStorage should be cleared
    const stored = await page.evaluate(() =>
      localStorage.getItem("recentlyViewed"),
    );
    expect(stored).toBeNull();
  });

  test("section renders with the violet History pill badge", async ({
    page,
  }) => {
    await mockSupabase(page);
    await seedRecentlyViewed(page, ["listing-1"]);
    await page.goto("/");

    await expect(page.getByText("Recently Viewed")).toBeVisible({
      timeout: 10_000,
    });
    // The pill badge next to the heading
    await expect(page.getByText("History")).toBeVisible();
  });

  test("section is not shown when Supabase returns no matches for stored IDs", async ({
    page,
  }) => {
    // Override listings mock to return empty (listings may have been deleted)
    await page.route(`${SUPABASE_URL}/rest/v1/listings**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
        headers: { "Content-Range": "0-0/0" },
      }),
    );
    // Also mock search API and other routes
    await mockSupabase(page);

    await seedRecentlyViewed(page, ["deleted-listing-id"]);
    await page.goto("/");

    await expect(page.getByText("Recently Viewed")).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
