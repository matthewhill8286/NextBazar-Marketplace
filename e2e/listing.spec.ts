import { expect, test } from "@playwright/test";
import { mockListings, mockSupabase } from "./helpers/mocks";

const slug = mockListings[0].slug; // "iphone-14-pro-nicosia"
const listing = mockListings[0];

test.describe("Listing detail page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto(`/listing/${slug}`);
  });

  test("shows the listing title", async ({ page }) => {
    await expect(page.getByText(listing.title)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the formatted price", async ({ page }) => {
    await expect(page.getByText(/€800/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the seller name", async ({ page }) => {
    await expect(page.getByText("John Doe").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the location", async ({ page }) => {
    await expect(page.getByText("Nicosia").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the category", async ({ page }) => {
    await expect(page.getByText("Electronics").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the condition", async ({ page }) => {
    await expect(page.getByText(/used|good|like new/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the description", async ({ page }) => {
    await expect(page.getByText(/Excellent condition/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows the 'Send Message' contact button", async ({ page }) => {
    await expect(
      page
        .getByRole("button", { name: /message|send message/i })
        .or(page.getByText(/send message/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows WhatsApp contact button when seller has a number", async ({
    page,
  }) => {
    await expect(
      page
        .getByRole("link", { name: /whatsapp/i })
        .or(page.getByText(/whatsapp/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows the verified badge for a verified seller", async ({ page }) => {
    await expect(
      page
        .locator('[data-testid="verified-badge"]')
        .or(page.getByTitle(/verified/i))
        .or(page.locator('svg[aria-label*="verified" i]'))
        .first(),
    ).toBeAttached({ timeout: 10_000 });
  });

  test("does NOT show a 404 for a valid slug", async ({ page }) => {
    await expect(page.getByText(/not found|404/i).first()).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("shows 404 state for an unknown slug", async ({ page }) => {
    // Override mock to return null for unknown slug
    await page.route("**/rest/v1/listings**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      }),
    );
    await page.goto("/listing/this-does-not-exist");
    await expect(page.getByText(/not found|removed/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows safety tips section", async ({ page }) => {
    await expect(
      page
        .getByText(/safety tips/i)
        .or(page.getByText(/meet in a public/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows view count", async ({ page }) => {
    await expect(page.getByText(/42|views/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Listing detail — featured listing", () => {
  test("shows the Featured badge on a promoted listing", async ({ page }) => {
    await mockSupabase(page);
    await page.goto(`/listing/${mockListings[1].slug}`);
    await expect(page.getByText(/Featured/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows Negotiable badge for a negotiable listing", async ({ page }) => {
    await mockSupabase(page);
    await page.goto(`/listing/${mockListings[1].slug}`);
    await expect(page.getByText("Negotiable").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
