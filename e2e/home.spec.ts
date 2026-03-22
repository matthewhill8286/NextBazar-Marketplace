import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mocks";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test("renders the NextBazar logo and brand name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("NextBazar").or(page.getByText("Next")).first()).toBeVisible();
  });

  test("shows the search bar in the navbar", async ({ page }) => {
    await page.goto("/");
    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search/i))
      .first();
    await expect(searchInput).toBeVisible();
  });

  test("navbar has Post Ad link", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /post/i }).first()
    ).toBeVisible();
  });

  test("navbar has saved (heart) icon", async ({ page }) => {
    await page.goto("/");
    const savedLink = page.getByRole("link", { name: /saved/i }).or(
      page.locator('a[href="/saved"]')
    );
    await expect(savedLink.first()).toBeVisible();
  });

  test("navbar has notifications (bell) icon", async ({ page }) => {
    await page.goto("/");
    const notifLink = page.locator('a[href*="notification"]');
    await expect(notifLink.first()).toBeVisible();
  });

  test("navbar has messages icon", async ({ page }) => {
    await page.goto("/");
    const messagesLink = page.locator('a[href="/messages"]');
    await expect(messagesLink.first()).toBeVisible();
  });

  test("listing cards are rendered", async ({ page }) => {
    await page.goto("/");
    // Wait for at least one listing card to appear
    await expect(
      page.getByText("iPhone 14 Pro").or(page.getByText("MacBook Pro")).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("listing card shows price", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/€800|€1,500/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("listing card shows location", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Nicosia").or(page.getByText("Limassol")).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("category chips are visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Electronics").or(page.getByText("Vehicles")).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a listing card navigates to listing detail", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: /iPhone 14 Pro/i }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();
    await expect(page).toHaveURL(/\/listing\//);
  });

  test("clicking the logo navigates to home", async ({ page }) => {
    await page.goto("/search");
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
