import { expect, test } from "@playwright/test";
import { mockAuthUser, mockSupabase } from "./helpers/mocks";

const SUPABASE_URL = "https://giseotbdmhdsxgjilrqk.supabase.co";

// ─── Saved search fixture ─────────────────────────────────────────────────────

const mockSavedSearch = {
  id: "ss-abc123",
  name: "electronics in nicosia",
  query: null,
  category_slug: "electronics",
  subcategory_slug: null,
  location_slug: "nicosia",
  price_min: null,
  price_max: null,
  sort_by: "newest",
  created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  last_notified_at: null,
};

/** Add a saved_searches route that starts empty and can be overridden per-test */
async function mockSavedSearches(
  page: Parameters<typeof mockAuthUser>[0],
  initial: typeof mockSavedSearch[] = [],
) {
  await page.route(`${SUPABASE_URL}/rest/v1/saved_searches**`, (route) => {
    const method = route.request().method();

    // INSERT — return the newly created row
    if (method === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ ...mockSavedSearch, id: "ss-new-1" }]),
        headers: { "Content-Range": "0-0/1" },
      });
    }

    // DELETE — 204 no content
    if (method === "DELETE") {
      return route.fulfill({ status: 204 });
    }

    // GET (check if already saved / list page)
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(initial),
      headers: { "Content-Range": `0-${initial.length}/${initial.length}` },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Save Search button", () => {
  test("is hidden when the user is not logged in", async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/search?category=electronics");
    // Button is hidden for guests — component returns null when userId is null
    await expect(
      page.getByRole("button", { name: /save search/i }),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test("is hidden when no filters are active", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/search");
    // No filters → hasFilters is false → component returns null
    await expect(
      page.getByRole("button", { name: /save search/i }),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test("appears when a category filter is active", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/search?category=electronics");
    await expect(
      page.getByRole("button", { name: /save search/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("appears when a text query is active", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/search?q=iphone");
    await expect(
      page.getByRole("button", { name: /save search/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("clicking Save search inserts the record", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/search?category=electronics&location=nicosia");

    const saveBtn = page.getByRole("button", { name: /save search/i });
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });

    // Capture the outgoing POST
    const [request] = await Promise.all([
      page.waitForRequest(
        (r) => r.url().includes("/rest/v1/saved_searches") && r.method() === "POST",
      ),
      saveBtn.click(),
    ]);

    expect(request.method()).toBe("POST");
    const body = request.postDataJSON();
    expect(body.category_slug).toBe("electronics");
    expect(body.location_slug).toBe("nicosia");
  });

  test("shows 'Saved!' feedback briefly after saving", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/search?category=electronics");

    const saveBtn = page.getByRole("button", { name: /save search/i });
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // Should flash "Saved!" text
    await expect(page.getByText(/saved!/i)).toBeVisible({ timeout: 3_000 });
  });

  test("shows 'Saved' state when the search is already saved", async ({
    page,
  }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    // Return the existing saved search so the maybeSingle() check finds a match
    await mockSavedSearches(page, [mockSavedSearch]);
    await page.goto("/search?category=electronics&location=nicosia");

    // Should render the "already saved" button variant (BellOff icon, "Saved" label)
    await expect(
      page.getByRole("button", { name: /saved/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
    // And "Save search" should NOT be present
    await expect(
      page.getByRole("button", { name: /^save search$/i }),
    ).not.toBeVisible({ timeout: 2_000 });
  });

  test("clicking the saved button removes the search", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page, [mockSavedSearch]);
    await page.goto("/search?category=electronics&location=nicosia");

    const savedBtn = page.getByRole("button", { name: /saved/i }).first();
    await expect(savedBtn).toBeVisible({ timeout: 10_000 });

    const [request] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.url().includes("/rest/v1/saved_searches") &&
          r.method() === "DELETE",
      ),
      savedBtn.click(),
    ]);

    expect(request.method()).toBe("DELETE");
  });
});

test.describe("Saved Searches dashboard", () => {
  test("shows empty state when no searches are saved", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/dashboard/saved-searches");

    await expect(
      page.getByText(/no saved searches/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("lists saved searches when they exist", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page, [mockSavedSearch]);
    await page.goto("/dashboard/saved-searches");

    await expect(
      page.getByText("electronics in nicosia"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("each saved search has a run-search link", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page, [mockSavedSearch]);
    await page.goto("/dashboard/saved-searches");

    // Wait for the saved search name to appear first
    await expect(page.getByText("electronics in nicosia")).toBeVisible({
      timeout: 10_000,
    });

    // The ExternalLink icon button navigates to the search URL
    await expect(page.getByTitle("Run search")).toBeVisible();
  });

  test("delete button removes a saved search", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page, [mockSavedSearch]);
    await page.goto("/dashboard/saved-searches");

    await expect(
      page.getByText("electronics in nicosia"),
    ).toBeVisible({ timeout: 10_000 });

    const deleteBtn = page.getByTitle("Delete").first();
    await expect(deleteBtn).toBeVisible();

    const [request] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.url().includes("/rest/v1/saved_searches") &&
          r.method() === "DELETE",
      ),
      deleteBtn.click(),
    ]);

    expect(request.method()).toBe("DELETE");
    // Row is removed from the UI optimistically
    await expect(page.getByText("electronics in nicosia")).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test("shows 'New Search' link that goes to /search", async ({ page }) => {
    await mockSupabase(page);
    await mockAuthUser(page);
    await mockSavedSearches(page);
    await page.goto("/dashboard/saved-searches");

    await expect(
      page.getByRole("link", { name: /new search/i }),
    ).toBeVisible({ timeout: 5_000 });
  });
});
