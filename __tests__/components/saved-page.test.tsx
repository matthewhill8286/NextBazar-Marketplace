import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockGetUser = vi.fn();
const mockToggle = vi.fn().mockResolvedValue(undefined);
let mockSavedIds = new Set<string>();
let mockSavedLoading = false;

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({
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
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img src={src as string} alt={alt} />
  ),
}));

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

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const map: Record<string, string> = {
      contact: "Contact",
      featured: "Featured",
      urgent: "Urgent",
      sold: "SOLD",
    };
    if (key === "timeMinutes") return `${params?.n}m`;
    if (key === "timeHours") return `${params?.n}h`;
    if (key === "timeDays") return `${params?.n}d`;
    return map[key] ?? key;
  },
}));

vi.mock("@/lib/saved-context", () => ({
  useSaved: () => ({
    savedIds: mockSavedIds,
    count: mockSavedIds.size,
    toggle: mockToggle,
    loading: mockSavedLoading,
    isSaved: (id: string) => mockSavedIds.has(id),
  }),
}));

vi.mock("@/lib/compare-context", () => ({
  useCompare: () => ({
    add: vi.fn(),
    remove: vi.fn(),
    isCompared: () => false,
    isFull: false,
  }),
}));

const mockSelect = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: mockSelect,
    }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

import SavedPage from "@/app/[locale]/dashboard/saved/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeUser = { id: "user-1" };

const fakeListing = {
  id: "listing-1",
  slug: "iphone-14",
  title: "iPhone 14",
  price: 500,
  currency: "EUR",
  primary_image_url: null,
  is_promoted: false,
  is_urgent: false,
  condition: "used_good",
  view_count: 10,
  created_at: new Date().toISOString(),
  categories: { name: "Electronics", slug: "electronics", icon: "📱" },
  locations: { name: "Nicosia", slug: "nicosia" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSavedIds = new Set<string>();
  mockSavedLoading = false;
  mockGetUser.mockResolvedValue({ data: { user: fakeUser } });
  mockSelect.mockReturnValue({
    in: vi.fn().mockResolvedValue({ data: [] }),
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SavedPage", () => {
  it("shows loading skeleton while saved context is loading", () => {
    mockSavedLoading = true;
    render(<SavedPage />);
    const pulseElements = document.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("redirects to login when no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<SavedPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/auth/login?redirect=/dashboard/saved",
      );
    });
  });

  it("shows empty state when no saved listings", async () => {
    mockSavedIds = new Set<string>();
    render(<SavedPage />);
    await waitFor(() => {
      expect(screen.getByText("No saved listings")).toBeInTheDocument();
    });
  });

  it("renders saved listings heading", async () => {
    mockSavedIds = new Set(["listing-1"]);
    mockSelect.mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: [fakeListing] }),
    });

    render(<SavedPage />);
    await waitFor(() => {
      expect(screen.getByText("Saved Listings")).toBeInTheDocument();
    });
  });

  it("shows item count", async () => {
    mockSavedIds = new Set(["listing-1"]);
    mockSelect.mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: [fakeListing] }),
    });

    render(<SavedPage />);
    await waitFor(() => {
      expect(screen.getByText("1 item saved")).toBeInTheDocument();
    });
  });

  it("renders listing cards for saved items", async () => {
    mockSavedIds = new Set(["listing-1"]);
    mockSelect.mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: [fakeListing] }),
    });

    render(<SavedPage />);
    await waitFor(() => {
      expect(screen.getByText("iPhone 14")).toBeInTheDocument();
    });
  });

  it("shows Clear all button when items exist", async () => {
    mockSavedIds = new Set(["listing-1"]);
    mockSelect.mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: [fakeListing] }),
    });

    render(<SavedPage />);
    await waitFor(() => {
      expect(screen.getByText(/Clear all/)).toBeInTheDocument();
    });
  });
});
