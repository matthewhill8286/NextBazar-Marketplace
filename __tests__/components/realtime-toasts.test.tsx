import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Hoisted shared state — must be declared before vi.mock factories run
// ---------------------------------------------------------------------------

const {
  capturedCallbacks,
  mockGetUser,
  mockFromImpl,
  mockRemoveChannel,
  mockToastCustom,
  mockPush,
} = vi.hoisted(() => {
  const capturedCallbacks: Record<string, (payload: any) => void> = {};

  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: "user-seller-1" } },
  });

  // Default from() chain: returns plausible data per table
  const mockFromImpl = vi.fn((table: string) => {
    const resolvedData =
      table === "profiles"
        ? { data: { display_name: "Alice Smith", avatar_url: null }, error: null }
        : table === "conversations"
          ? { data: { listings: { title: "iPhone 14 Pro" } }, error: null }
          : { data: { title: "iPhone 14 Pro" }, error: null }; // listings

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(resolvedData),
    };
  });

  const mockRemoveChannel = vi.fn();
  const mockToastCustom = vi.fn();
  const mockPush = vi.fn();

  return {
    capturedCallbacks,
    mockGetUser,
    mockFromImpl,
    mockRemoveChannel,
    mockToastCustom,
    mockPush,
  };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    channel: vi.fn((name: string) => {
      const ch = {
        on: vi.fn((event: string, filter: any, cb: (p: any) => void) => {
          // Key by table name so tests can fire message vs offer callbacks
          capturedCallbacks[filter.table] = cb;
          return ch;
        }),
        subscribe: vi.fn(() => ch),
      };
      return ch;
    }),
    removeChannel: mockRemoveChannel,
    from: mockFromImpl,
  }),
}));

vi.mock("sonner", () => ({
  toast: { custom: mockToastCustom, dismiss: vi.fn() },
}));

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Flush all microtasks/promises so async useEffect setup completes
const flushAsync = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

import RealtimeToasts from "@/app/components/realtime-toasts";

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname = "/";

  // Restore default getUser (logged-in user)
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-seller-1" } } });

  // Clear captured callbacks between tests
  Object.keys(capturedCallbacks).forEach((k) => delete capturedCallbacks[k]);
});

// ---------------------------------------------------------------------------

describe("RealtimeToasts", () => {
  // ── Mounting ──────────────────────────────────────────────────────────────

  it("renders nothing visible (returns null)", async () => {
    const { container } = render(<RealtimeToasts />);
    await flushAsync();
    expect(container).toBeEmptyDOMElement();
  });

  it("checks auth state on mount", async () => {
    render(<RealtimeToasts />);
    await flushAsync();
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it("does NOT subscribe to any channel when user is not logged in", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    render(<RealtimeToasts />);
    await flushAsync();
    // Neither callback should be captured
    expect(capturedCallbacks.messages).toBeUndefined();
    expect(capturedCallbacks.offers).toBeUndefined();
  });

  it("subscribes to messages and offers channels when authenticated", async () => {
    render(<RealtimeToasts />);
    await flushAsync();
    expect(capturedCallbacks.messages).toBeTypeOf("function");
    expect(capturedCallbacks.offers).toBeTypeOf("function");
  });

  // ── Message toasts ────────────────────────────────────────────────────────

  it("shows a message toast when a new message arrives from another user", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-1",
          sender_id: "user-buyer-1",        // not the logged-in seller
          conversation_id: "conv-1",
          content: "Is this still available?",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    expect(mockToastCustom).toHaveBeenCalledOnce();
  });

  it("does NOT show a toast when the user receives their own message", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-2",
          sender_id: "user-seller-1",       // same as logged-in user
          conversation_id: "conv-1",
          content: "Here is my reply",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    expect(mockToastCustom).not.toHaveBeenCalled();
  });

  it("suppresses toast when user is already viewing that conversation", async () => {
    mockPathname = "/en/messages/conv-1";   // user is on this page
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-3",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",        // same conversation
          content: "Hello?",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    expect(mockToastCustom).not.toHaveBeenCalled();
  });

  it("allows toast when user is viewing a DIFFERENT conversation", async () => {
    mockPathname = "/en/messages/conv-99";  // different conversation
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-4",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",        // different from current page
          content: "Hi there",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    expect(mockToastCustom).toHaveBeenCalledOnce();
  });

  it("fetches sender profile and listing title before showing message toast", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-5",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",
          content: "Great listing!",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    // Should have called from("profiles") and from("conversations")
    const tablesCalled = mockFromImpl.mock.calls.map(([t]: [string]) => t);
    expect(tablesCalled).toContain("profiles");
    expect(tablesCalled).toContain("conversations");
  });

  it("toast render function includes sender name and listing title", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-6",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",
          content: "Is the price negotiable?",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    expect(mockToastCustom).toHaveBeenCalledOnce();

    // Render the JSX returned by the custom toast render function
    const renderFn = mockToastCustom.mock.calls[0][0] as (id: string) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-1"));

    expect(getByText("Alice Smith")).toBeInTheDocument();
    expect(getByText(/iPhone 14 Pro/i)).toBeInTheDocument();
    expect(getByText(/Is the price negotiable\?/i)).toBeInTheDocument();
  });

  it("labels in-chat offer messages as 'In-chat offer' not 'New message'", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-7",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",
          content: null,
          message_type: "offer",
          offer_price: 750,
        },
      });
    });

    const renderFn = mockToastCustom.mock.calls[0][0] as (id: string) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-2"));
    expect(getByText(/In-chat offer/i)).toBeInTheDocument();
    expect(getByText(/€750/)).toBeInTheDocument();
  });

  it("toast 'View conversation' button navigates to correct URL", async () => {
    const { getByRole } = render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-8",
          sender_id: "user-buyer-1",
          conversation_id: "conv-42",
          content: "Hello!",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    const renderFn = mockToastCustom.mock.calls[0][0] as (id: string) => React.ReactElement;
    const { getByRole: getButton } = render(renderFn("toast-id-3"));

    const btn = getButton("button", { name: /view conversation/i });
    btn.click();

    expect(mockPush).toHaveBeenCalledWith("/messages/conv-42");
  });

  // ── Offer toasts ──────────────────────────────────────────────────────────

  it("shows an offer toast when a new offer arrives on the seller's listing", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.offers({
        new: {
          id: "offer-1",
          buyer_id: "user-buyer-1",
          seller_id: "user-seller-1",
          listing_id: "listing-1",
          amount: 850,
          currency: "EUR",
        },
      });
    });

    expect(mockToastCustom).toHaveBeenCalledOnce();
  });

  it("offer toast render function shows buyer name, listing title, and formatted amount", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.offers({
        new: {
          id: "offer-2",
          buyer_id: "user-buyer-1",
          seller_id: "user-seller-1",
          listing_id: "listing-1",
          amount: 1200,
          currency: "EUR",
        },
      });
    });

    const renderFn = mockToastCustom.mock.calls[0][0] as (id: string) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-4"));

    expect(getByText("Alice Smith")).toBeInTheDocument();
    expect(getByText(/iPhone 14 Pro/)).toBeInTheDocument();
    expect(getByText("€1,200")).toBeInTheDocument();
  });

  it("fetches buyer profile and listing title before showing offer toast", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.offers({
        new: {
          id: "offer-3",
          buyer_id: "user-buyer-2",
          seller_id: "user-seller-1",
          listing_id: "listing-2",
          amount: 500,
          currency: "EUR",
        },
      });
    });

    const tablesCalled = mockFromImpl.mock.calls.map(([t]: [string]) => t);
    expect(tablesCalled).toContain("profiles");
    expect(tablesCalled).toContain("listings");
  });

  it("offer toast 'Review offer' button navigates to offers page with offer id", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.offers({
        new: {
          id: "offer-99",
          buyer_id: "user-buyer-1",
          seller_id: "user-seller-1",
          listing_id: "listing-1",
          amount: 300,
          currency: "EUR",
        },
      });
    });

    const renderFn = mockToastCustom.mock.calls[0][0] as (id: string) => React.ReactElement;
    const { getByRole } = render(renderFn("toast-id-5"));

    getByRole("button", { name: /review offer/i }).click();

    expect(mockPush).toHaveBeenCalledWith("/dashboard/offers?offer=offer-99");
  });

  it("uses € symbol for EUR currency in offer toast", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.offers({
        new: {
          id: "offer-4",
          buyer_id: "user-buyer-1",
          seller_id: "user-seller-1",
          listing_id: "listing-1",
          amount: 999,
          currency: "EUR",
        },
      });
    });

    const renderFn = mockToastCustom.mock.calls[0][0] as (id: string) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-6"));
    expect(getByText("€999")).toBeInTheDocument();
  });

  // ── Duration options ──────────────────────────────────────────────────────

  it("sets offer toast duration to 10 seconds", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.offers({
        new: {
          id: "offer-5",
          buyer_id: "user-buyer-1",
          seller_id: "user-seller-1",
          listing_id: "listing-1",
          amount: 100,
          currency: "EUR",
        },
      });
    });

    const options = mockToastCustom.mock.calls[0][1];
    expect(options.duration).toBe(10000);
  });

  it("sets message toast duration to 7 seconds", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks.messages({
        new: {
          id: "msg-dur",
          sender_id: "user-buyer-1",
          conversation_id: "conv-dur",
          content: "Quick question",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    const options = mockToastCustom.mock.calls[0][1];
    expect(options.duration).toBe(7000);
  });
});
