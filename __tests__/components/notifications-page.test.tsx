import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseAuth, mockSelect } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

// Mock the child component to isolate the page's loading/fetching logic
vi.mock(
  "@/app/[locale]/dashboard/notifications/notifications-client",
  () => ({
    default: ({ initialNotifications }: { initialNotifications: any[] }) => (
      <div data-testid="notifications-client">
        {initialNotifications.length} notifications loaded
      </div>
    ),
  }),
);

import NotificationsPage from "@/app/[locale]/dashboard/notifications/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeUser = { id: "user-1" };

const fakeNotification = {
  id: "notif-1",
  type: "offer_received",
  title: "New offer received",
  body: "Someone made an offer on your listing",
  listing_id: "listing-1",
  offer_id: "offer-1",
  link: "/dashboard/offers",
  read: false,
  created_at: new Date().toISOString(),
  user_id: "user-1",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ userId: fakeUser.id, loading: false, profileVersion: 0, refreshProfile: vi.fn() });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationsPage", () => {
  it("shows loading skeleton initially", () => {
    // Keep the fetch promise pending to show loading state
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
        }),
      }),
    });
    mockUseAuth.mockReturnValue({ userId: fakeUser.id, loading: false, profileVersion: 0, refreshProfile: vi.fn() });
    render(<NotificationsPage />);
    const pulseElements = document.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("renders NotificationsClient when data loaded (no user)", async () => {
    mockUseAuth.mockReturnValue({ userId: null, loading: false, profileVersion: 0, refreshProfile: vi.fn() });
    render(<NotificationsPage />);
    await waitFor(() => {
      const client = screen.getByTestId("notifications-client");
      expect(client).toBeInTheDocument();
      expect(client).toHaveTextContent("0 notifications loaded");
    });
  });

  it("fetches and passes notifications to client component", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValue({ data: [fakeNotification] }),
        }),
      }),
    });

    render(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-client")).toHaveTextContent(
        "1 notifications loaded",
      );
    });
  });

  it("passes empty array when no notifications exist", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    });

    render(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-client")).toHaveTextContent(
        "0 notifications loaded",
      );
    });
  });

  it("handles null data gracefully", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    render(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-client")).toHaveTextContent(
        "0 notifications loaded",
      );
    });
  });
});
