import { act, render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted shared state — must be declared before vi.mock factories run
// ---------------------------------------------------------------------------

const {
  capturedCallbacks,
  mockUserId,
  mockFromImpl,
  mockToastCustom,
  mockPush,
} = vi.hoisted(() => {
  // Keyed by table name from useRealtimeTable calls
  const capturedCallbacks: Record<string, (payload: any) => void> = {};

  const mockUserId = { value: "user-seller-1" as string | null };

  // Default from() chain: returns plausible data per table
  const mockFromImpl = vi.fn((table: string) => {
    const resolvedData =
      table === "profiles"
        ? {
            data: { display_name: "Alice Smith", avatar_url: null },
            error: null,
          }
        : table === "conversations"
          ? { data: { listings: { title: "iPhone 14 Pro" } }, error: null }
          : { data: { title: "iPhone 14 Pro" }, error: null }; // listings

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(resolvedData),
    };
  });

  const mockToastCustom = vi.fn();
  const mockPush = vi.fn();

  return {
    capturedCallbacks,
    mockUserId,
    mockFromImpl,
    mockToastCustom,
    mockPush,
  };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ userId: mockUserId.value }),
}));

vi.mock("@/lib/hooks/use-realtime-table", () => ({
  useRealtimeTable: (opts: any) => {
    // Capture the onPayload callback keyed by table so tests can trigger it
    if (opts.enabled !== false) {
      capturedCallbacks[`${opts.event}:${opts.table}`] = opts.onPayload;
    }
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFromImpl,
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { custom: mockToastCustom, dismiss: vi.fn() },
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", props),
}));

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const flushAsync = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

import RealtimeToasts from "@/app/components/realtime-toasts";

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname = "/";
  mockUserId.value = "user-seller-1";

  // Clear captured callbacks between tests
  Object.keys(capturedCallbacks).forEach((k) => {
    delete capturedCallbacks[k];
  });
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
    // The component uses useCurrentUser which is always called — verify
    // subscriptions are set up (which implies userId was read)
    expect(capturedCallbacks["INSERT:messages"]).toBeTypeOf("function");
  });

  it("does NOT subscribe to any channel when user is not logged in", async () => {
    mockUserId.value = null;
    render(<RealtimeToasts />);
    await flushAsync();
    // useRealtimeTable should have enabled: false so callbacks aren't captured
    // Component should bail early when userId is null
    expect(capturedCallbacks["INSERT:messages"]).toBeUndefined();
  });

  it("subscribes to messages and offers channels when authenticated", async () => {
    render(<RealtimeToasts />);
    await flushAsync();
    expect(capturedCallbacks["INSERT:messages"]).toBeTypeOf("function");
    expect(capturedCallbacks["INSERT:offers"]).toBeTypeOf("function");
  });

  // ── Message toasts ────────────────────────────────────────────────────────

  it("shows a message toast when a new message arrives from another user", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:messages"]({
        new: {
          id: "msg-1",
          sender_id: "user-buyer-1",
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
      await capturedCallbacks["INSERT:messages"]({
        new: {
          id: "msg-2",
          sender_id: "user-seller-1", // same as logged-in user
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
    mockPathname = "/en/dashboard/messages/conv-1";
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:messages"]({
        new: {
          id: "msg-3",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",
          content: "Hello?",
          message_type: "text",
          offer_price: null,
        },
      });
    });

    expect(mockToastCustom).not.toHaveBeenCalled();
  });

  it("allows toast when user is viewing a DIFFERENT conversation", async () => {
    mockPathname = "/en/dashboard/messages/conv-99";
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:messages"]({
        new: {
          id: "msg-4",
          sender_id: "user-buyer-1",
          conversation_id: "conv-1",
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
      await capturedCallbacks["INSERT:messages"]({
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

    const tablesCalled = mockFromImpl.mock.calls.map(([t]: [string]) => t);
    expect(tablesCalled).toContain("profiles");
    expect(tablesCalled).toContain("conversations");
  });

  it("toast render function includes sender name and listing title", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:messages"]({
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

    const renderFn = mockToastCustom.mock.calls[0][0] as (
      id: string,
    ) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-1"));

    expect(getByText("Alice Smith")).toBeInTheDocument();
    expect(getByText(/iPhone 14 Pro/i)).toBeInTheDocument();
    expect(getByText(/Is the price negotiable\?/i)).toBeInTheDocument();
  });

  it("labels in-chat offer messages as 'In-chat offer' not 'New message'", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:messages"]({
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

    const renderFn = mockToastCustom.mock.calls[0][0] as (
      id: string,
    ) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-2"));
    expect(getByText(/In-chat offer/i)).toBeInTheDocument();
    expect(getByText(/€750/)).toBeInTheDocument();
  });

  it("toast 'View conversation' button navigates to correct URL", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:messages"]({
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

    const renderFn = mockToastCustom.mock.calls[0][0] as (
      id: string,
    ) => React.ReactElement;
    const { getByRole: getButton } = render(renderFn("toast-id-3"));

    const btn = getButton("button", { name: /view conversation/i });
    btn.click();

    expect(mockPush).toHaveBeenCalledWith("/dashboard/messages/conv-42");
  });

  // ── Offer toasts ──────────────────────────────────────────────────────────

  it("shows an offer toast when a new offer arrives on the seller's listing", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:offers"]({
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
      await capturedCallbacks["INSERT:offers"]({
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

    const renderFn = mockToastCustom.mock.calls[0][0] as (
      id: string,
    ) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-4"));

    expect(getByText("Alice Smith")).toBeInTheDocument();
    expect(getByText(/iPhone 14 Pro/)).toBeInTheDocument();
    expect(getByText("€1,200")).toBeInTheDocument();
  });

  it("fetches buyer profile and listing title before showing offer toast", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:offers"]({
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
      await capturedCallbacks["INSERT:offers"]({
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

    const renderFn = mockToastCustom.mock.calls[0][0] as (
      id: string,
    ) => React.ReactElement;
    const { getByRole } = render(renderFn("toast-id-5"));

    getByRole("button", { name: /review offer/i }).click();

    expect(mockPush).toHaveBeenCalledWith("/dashboard/offers?offer=offer-99");
  });

  it("uses € symbol for EUR currency in offer toast", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:offers"]({
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

    const renderFn = mockToastCustom.mock.calls[0][0] as (
      id: string,
    ) => React.ReactElement;
    const { getByText } = render(renderFn("toast-id-6"));
    expect(getByText("€999")).toBeInTheDocument();
  });

  // ── Duration options ──────────────────────────────────────────────────────

  it("sets offer toast duration to 10 seconds", async () => {
    render(<RealtimeToasts />);
    await flushAsync();

    await act(async () => {
      await capturedCallbacks["INSERT:offers"]({
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
      await capturedCallbacks["INSERT:messages"]({
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
