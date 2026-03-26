import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
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
  mockGetUser.mockResolvedValue({ data: { user: fakeUser } });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationsPage", () => {
  it("shows loading skeleton initially", () => {
    // Never resolve getUser to keep loading state
    mockGetUser.mockReturnValue(new Promise(() => {}));
    render(<NotificationsPage />);
    const pulseElements = document.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("renders NotificationsClient when data loaded (no user)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
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
