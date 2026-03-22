import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mocks";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/auth/login");
  });

  test("renders the login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome back/i }).first()).toBeVisible();
  });

  test("has an email input", async ({ page }) => {
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()).toBeVisible();
  });

  test("has a password input", async ({ page }) => {
    await expect(
      page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first()
    ).toBeVisible();
  });

  test("has a submit button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /sign in|log in|continue/i }).first()
    ).toBeVisible();
  });

  test("has a link to the register page", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /register|sign up|create account/i }).first()
    ).toBeVisible();
  });

  test("shows a validation error when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: /sign in|log in|continue/i }).first().click();
    // Either HTML5 validation or a visible error message
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    const isInvalid =
      (await emailInput.evaluate((el: HTMLInputElement) => el.validity?.valueMissing)) ?? false;
    const errorVisible = await page.getByText(/required|invalid|enter your email/i).first().isVisible().catch(() => false);
    expect(isInvalid || errorVisible).toBe(true);
  });

  test("shows the 'Continue with Google' button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /google/i })
        .or(page.getByText(/continue with google/i))
        .first()
    ).toBeVisible();
  });

  test("shows an error on invalid credentials", async ({ page }) => {
    // Mock Supabase auth to return an error
    await page.route("**/auth/v1/token**", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }),
      })
    );

    await page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first().fill("wrong@example.com");
    await page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first().fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in|continue/i }).first().click();

    await expect(
      page.getByText(/invalid|incorrect|error/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/auth/register");
  });

  test("renders the register form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /register|create account|sign up/i }).first()
    ).toBeVisible();
  });

  test("has email and password inputs", async ({ page }) => {
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first()).toBeVisible();
  });

  test("has a link back to the login page", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /sign in|log in|already have an account/i }).first()
    ).toBeVisible();
  });
});

test.describe("Auth redirect behaviour", () => {
  test("visiting /saved when not signed in redirects to login", async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/saved");
    await expect(page).toHaveURL(/auth\/login|login/, { timeout: 8_000 });
  });

  test("visiting /notifications when not signed in redirects to login", async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/dashboard/notifications");
    await expect(page).toHaveURL(/auth\/login|login/, { timeout: 8_000 });
  });

  test("visiting /post when not signed in redirects to login", async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/post");
    await expect(page).toHaveURL(/auth\/login|login/, { timeout: 8_000 });
  });

  test("visiting /messages when not signed in redirects to login", async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/messages");
    await expect(page).toHaveURL(/auth\/login|login/, { timeout: 8_000 });
  });
});
