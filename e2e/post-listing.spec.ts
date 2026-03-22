import { test, expect } from "@playwright/test";
import { mockSupabase, mockAuthUser } from "./helpers/mocks";

test.describe("Post listing — unauthenticated", () => {
  test("redirects to login when not signed in", async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/post");
    await expect(page).toHaveURL(/auth\/login|login/, { timeout: 8_000 });
  });
});

test.describe("Post listing — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
    await mockSupabase(page);

    // Mock profile fetch
    await page.route("**/rest/v1/profiles**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-test-1",
          display_name: "Test User",
          avatar_url: null,
          verified: false,
          rating: 0,
          total_reviews: 0,
          is_dealer: false,
          created_at: "2024-01-01T00:00:00Z",
          whatsapp_number: null,
          telegram_username: null,
        }),
      })
    );

    await page.goto("/post");
  });

  test("renders the post listing form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /post|listing|sell/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has a title input", async ({ page }) => {
    await expect(
      page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has a price input", async ({ page }) => {
    await expect(
      page.getByLabel(/price/i).or(page.getByPlaceholder(/price/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has a description input", async ({ page }) => {
    await expect(
      page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has a category selector", async ({ page }) => {
    await expect(
      page.getByLabel(/category/i).or(page.getByText(/category/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows a validation error when submitting without a title", async ({ page }) => {
    const submitBtn = page
      .getByRole("button", { name: /post|publish|submit|list/i })
      .first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    await expect(
      page.getByText(/required|title|please/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("has AI autofill button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /ai|autofill|auto-fill/i })
        .or(page.getByText(/auto.?fill with ai/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Saved listings page — authenticated", () => {
  test("renders the saved listings page when signed in", async ({ page }) => {
    await mockAuthUser(page);
    await mockSupabase(page);

    // Mock listing_favorites as empty
    await page.route("**/rest/v1/listing_favorites**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/saved");
    await expect(
      page.getByRole("heading", { name: /saved/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows empty state when no listings are saved", async ({ page }) => {
    await mockAuthUser(page);
    await mockSupabase(page);

    await page.route("**/rest/v1/listing_favorites**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/saved");
    await expect(
      page.getByText(/no saved|nothing saved|haven't saved|start saving/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
