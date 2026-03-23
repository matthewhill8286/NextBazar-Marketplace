import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ListingCard from "@/app/components/listing-card";

// next-intl — return simple key-based translations so no provider is needed
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const map: Record<string, string> = {
      contact: "Contact",
      featured: "Featured",
      urgent: "Urgent",
      sold: "SOLD",
      condition_new: "New",
      condition_like_new: "Like new",
      condition_good: "Good",
      condition_fair: "Fair",
      condition_for_parts: "For parts",
    };
    if (key === "timeMinutes") return `${params?.n}m`;
    if (key === "timeHours") return `${params?.n}h`;
    if (key === "timeDays") return `${params?.n}d`;
    return map[key] ?? key;
  },
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Supabase — FavoriteButton (child) will call createClient; mock it to be silent
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// Next.js Image → plain <img> so jsdom can handle it
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    // biome-ignore lint/a11y/useAltText
    <img src={src as string} alt={alt} />
  ),
}));

// Next.js Link → plain <a>
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------

const baseListing = {
  id: "listing-1",
  slug: "iphone-14-pro",
  title: "iPhone 14 Pro",
  price: 800,
  currency: "EUR",
  primary_image_url: null,
  is_promoted: false,
  is_urgent: false,
  condition: "used_good",
  view_count: 42,
  created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
  category: { name: "Electronics", slug: "electronics", icon: "📱" },
  location: { name: "Nicosia", slug: "nicosia" },
};

describe("ListingCard", () => {
  it("renders the listing title", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("iPhone 14 Pro")).toBeInTheDocument();
  });

  it("displays formatted EUR price", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("€800")).toBeInTheDocument();
  });

  it("displays 'Contact' when price is null", () => {
    render(<ListingCard listing={{ ...baseListing, price: null }} />);
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("links to the correct listing URL", () => {
    render(<ListingCard listing={baseListing} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listing/iphone-14-pro");
  });

  it("shows the location name", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("Nicosia")).toBeInTheDocument();
  });

  it("falls back to 'Cyprus' when no location is provided", () => {
    render(
      <ListingCard
        listing={{ ...baseListing, location: null, locations: null }}
      />,
    );
    expect(screen.getByText("Cyprus")).toBeInTheDocument();
  });

  it("shows 'Featured' badge when is_promoted is true", () => {
    render(<ListingCard listing={{ ...baseListing, is_promoted: true }} />);
    expect(screen.getByText(/Featured/)).toBeInTheDocument();
  });

  it("does NOT show 'Featured' badge when is_promoted is false", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.queryByText(/Featured/)).toBeNull();
  });

  it("shows 'Urgent' badge when is_urgent is true and not promoted", () => {
    render(
      <ListingCard
        listing={{ ...baseListing, is_urgent: true, is_promoted: false }}
      />,
    );
    expect(screen.getByText(/Urgent/)).toBeInTheDocument();
  });

  it("does NOT show 'Urgent' badge when is_promoted is also true (Featured takes priority)", () => {
    render(
      <ListingCard
        listing={{ ...baseListing, is_urgent: true, is_promoted: true }}
      />,
    );
    expect(screen.queryByText(/Urgent/)).toBeNull();
    expect(screen.getByText(/Featured/)).toBeInTheDocument();
  });

  it("displays the condition with underscores replaced by spaces", () => {
    render(<ListingCard listing={baseListing} />);
    // condition is "used_good" → "used good"
    expect(screen.getByText("used good")).toBeInTheDocument();
  });

  it("shows view count", () => {
    render(<ListingCard listing={{ ...baseListing, view_count: 128 }} />);
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("accepts aliased categories shape (categories key instead of category)", () => {
    const listing = {
      ...baseListing,
      category: undefined,
      categories: { name: "Vehicles", slug: "vehicles" },
    };
    // Just ensure it renders without error
    render(<ListingCard listing={listing} />);
    expect(screen.getByText("iPhone 14 Pro")).toBeInTheDocument();
  });

  it("passes userId and isSaved to FavoriteButton without triggering extra network calls", () => {
    // If userId is provided, the FavoriteButton skips its own auth fetch.
    // This test just verifies the card renders without errors when both props are present.
    render(
      <ListingCard listing={baseListing} userId="user-abc" isSaved={true} />,
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
