import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — set up BEFORE importing the component
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn().mockReturnValue({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
});

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

const selectMock = vi.fn().mockReturnValue({
  or: vi.fn().mockReturnValue({
    order: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [] }),
    }),
  }),
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: selectMock,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
    }),
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
  mockGetUser.mockResolvedValue({ data: { user: fakeUser } });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MessagesPage", () => {
  it("shows loading skeleton initially", () => {
    // Never resolve getUser to keep loading state
    mockGetUser.mockReturnValue(new Promise(() => {}));
    render(<MessagesPage />);
    // Should have skeleton pulse elements
    const pulseElements = document.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("redirects to login when no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
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
