import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DashboardProvider,
  useDashboardData,
} from "@/app/[locale]/dashboard/dashboard-context";
import type { DashboardListing } from "@/lib/supabase/supabase.types";

// ---------------------------------------------------------------------------
// Test consumer component — renders context values for assertion
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { listings, isDealer, isProSeller } = useDashboardData();
  return (
    <div>
      <span data-testid="count">{listings.length}</span>
      <span data-testid="dealer">{String(isDealer)}</span>
      <span data-testid="pro">{String(isProSeller)}</span>
    </div>
  );
}

// Minimal listing factory
function makeListing(overrides: Partial<DashboardListing> = {}): DashboardListing {
  return {
    id: "l-1",
    title: "Test",
    slug: "test",
    price: 100,
    currency: "EUR",
    price_type: "fixed",
    condition: "new",
    status: "active",
    primary_image_url: null,
    view_count: 0,
    favorite_count: 0,
    message_count: 0,
    is_promoted: false,
    is_urgent: false,
    promoted_until: null,
    created_at: new Date().toISOString(),
    expires_at: null,
    category_id: "c-1",
    location_id: "loc-1",
    categories: { name: "Cars", slug: "cars", icon: "car" },
    locations: { name: "Limassol" },
    ...overrides,
  } as DashboardListing;
}

describe("DashboardContext", () => {
  it("provides default values when no provider is used", () => {
    render(<TestConsumer />);
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("dealer").textContent).toBe("false");
    expect(screen.getByTestId("pro").textContent).toBe("false");
  });

  it("provides listing data through the provider", () => {
    const listings = [makeListing(), makeListing({ id: "l-2" })];
    render(
      <DashboardProvider
        value={{ listings, isDealer: true, isProSeller: true }}
      >
        <TestConsumer />
      </DashboardProvider>,
    );
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("dealer").textContent).toBe("true");
    expect(screen.getByTestId("pro").textContent).toBe("true");
  });

  it("provides isDealer=false, isProSeller=false for regular users", () => {
    render(
      <DashboardProvider
        value={{ listings: [], isDealer: false, isProSeller: false }}
      >
        <TestConsumer />
      </DashboardProvider>,
    );
    expect(screen.getByTestId("dealer").textContent).toBe("false");
    expect(screen.getByTestId("pro").textContent).toBe("false");
  });
});
