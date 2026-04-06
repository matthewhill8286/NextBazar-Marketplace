import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — set up BEFORE importing the component
// ---------------------------------------------------------------------------

const { mockPush, mockUseAuth, mockFrom, mockChannel } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseAuth: vi.fn(),
  mockFrom: vi.fn(),
  mockChannel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  }),
}));

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
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
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

vi.mock("@/lib/format-helpers", () => ({
  timeAgoCompact: (d: string | null) => (d ? "2h" : ""),
}));

vi.mock("@/lib/hooks/use-realtime-table", () => ({
  useRealtimeTable: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const selectMock = vi.fn().mockReturnValue({
  or: vi.fn().mockReturnValue({
    order: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [] }),
    }),
  }),
});

// Chain mock that supports .eq().eq().single() — used by dealer_shops query
const makeChainMock = (resolvedData: unknown = null) => {
  const single = vi.fn().mockResolvedValue({ data: resolvedData });
  const eq2 = vi.fn().mockReturnValue({ single });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  return { eq: eq1 };
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue(makeChainMock(null)),
        };
      }
      return {
        select: selectMock,
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
      };
    },
    channel: mockChannel,
    removeChannel: vi.fn(),
  }),
}));

import MessagesPage from "@/app/[locale]/dashboard/messages/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeUser = { id: "user-1", email: "test@test.com" };

const fakeConversation = {
  id: "conv-1",
  buyer_id: "user-1",
  seller_id: "user-2",
  last_message_at: new Date().toISOString(),
  last_message_preview: "Hey, is this still available?",
  is_pinned: false,
  listings: {
    id: "listing-1",
    title: "iPhone 14 Pro",
    slug: "iphone-14-pro",
    primary_image_url: null,
  },
  buyer: { id: "user-1", display_name: "Alice", avatar_url: null },
  seller: { id: "user-2", display_name: "Bob", avatar_url: null },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ userId: fakeUser.id, loading: false, profileVersion: 0, refreshProfile: vi.fn() });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MessagesPage", () => {
  it("shows loading skeleton initially", () => {
    // Set loading to true to keep loading state
    mockUseAuth.mockReturnValue({ userId: null, loading: true, profileVersion: 0, refreshProfile: vi.fn() });
    render(<MessagesPage />);
    // Should have skeleton pulse elements
    const pulseElements = document.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("redirects to login when no user", async () => {
    mockUseAuth.mockReturnValue({ userId: null, loading: false, profileVersion: 0, refreshProfile: vi.fn() });
    render(<MessagesPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/auth/login?redirect=/dashboard/messages",
      );
    });
  });

  it("shows empty state when no conversations", async () => {
    selectMock.mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    });

    render(<MessagesPage />);
    await waitFor(() => {
      expect(screen.getByText("No messages yet")).toBeInTheDocument();
    });
  });

  it("renders conversation list with user names", async () => {
    selectMock.mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi
            .fn()
            .mockResolvedValue({ data: [fakeConversation] }),
        }),
      }),
    });

    render(<MessagesPage />);
    await waitFor(() => {
      // Other user's name (Bob, since the current user is the buyer)
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("renders listing title in conversation row", async () => {
    selectMock.mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi
            .fn()
            .mockResolvedValue({ data: [fakeConversation] }),
        }),
      }),
    });

    render(<MessagesPage />);
    await waitFor(() => {
      expect(screen.getByText("Re: iPhone 14 Pro")).toBeInTheDocument();
    });
  });

  it("renders search input when conversations exist", async () => {
    selectMock.mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi
            .fn()
            .mockResolvedValue({ data: [fakeConversation] }),
        }),
      }),
    });

    render(<MessagesPage />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search conversations..."),
      ).toBeInTheDocument();
    });
  });

  it("links conversations to /dashboard/messages/:id", async () => {
    selectMock.mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi
            .fn()
            .mockResolvedValue({ data: [fakeConversation] }),
        }),
      }),
    });

    render(<MessagesPage />);
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /Bob/i });
      expect(link).toHaveAttribute("href", "/dashboard/messages/conv-1");
    });
  });
});
