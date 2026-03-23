import { expect, test } from "@playwright/test";
import { mockSupabase } from "./helpers/mocks";

test.describe("Search page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/search");
  });

  test("renders a search input", async ({ page }) => {
    const input = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search/i))
      .first();
    await expect(input).toBeVisible();
  });

  test("shows listing results on load", async ({ page }) => {
    await expect(
      page.getByText("iPhone 14 Pro").or(page.getByText("MacBook Pro")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("typing in the search box updates the URL query param", async ({
    page,
  }) => {
    const input = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search/i))
      .first();
    await input.fill("macbook");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/[?&]q=macbook/i, { timeout: 5_000 });
  });

  test("pre-fills the search input when q param is in the URL", async ({
    page,
  }) => {
    await page.goto("/search?q=iphone");
    const input = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search/i))
      .first();
    await expect(input).toHaveValue(/iphone/i, { timeout: 5_000 });
  });

  test("shows the Featured badge on a promoted listing", async ({ page }) => {
    // macbook is is_promoted: true
    await expect(page.getByText(/Featured/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("clicking a result card navigates to listing detail", async ({
    page,
  }) => {
    const card = page
      .getByRole("link", { name: /iPhone 14 Pro|MacBook Pro/i })
      .first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();
    await expect(page).toHaveURL(/\/listing\//);
  });

  test("shows empty state when no results match", async ({ page }) => {
    // Override the mock to return empty listings for this test
    await page.route("**/rest/v1/listings**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
        headers: { "Content-Range": "0-0/0" },
      }),
    );
    await page.goto("/search?q=xyzunmatchable");
    await expect(
      page.getByText(/no listings|no results|nothing found/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("filter button is present on the search page", async ({ page }) => {
    // Look for a filter button or icon
    const filterBtn = page
      .getByRole("button", { name: /filter/i })
      .or(page.locator('[aria-label*="filter" i]'))
      .first();
    await expect(filterBtn).toBeVisible({ timeout: 5_000 });
  });
});
