import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactButtons } from "@/app/[locale]/listing/[slug]/listing-actions";

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockConversationsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => mockConversationsChain),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: null } });
  mockConversationsChain.maybeSingle.mockResolvedValue({ data: null });
  mockConversationsChain.single.mockResolvedValue({ data: { id: "conv-1" } });
});

// ---------------------------------------------------------------------------

const baseProps = {
  listingId: "listing-1",
  sellerId: "seller-1",
  listingTitle: "MacBook Pro",
  contactPhone: null,
  whatsappNumber: null,
  telegramUsername: null,
};

describe("ContactButtons — Send Message", () => {
  it("always renders the Send Message button", () => {
    render(<ContactButtons {...baseProps} />);
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("redirects to login when unauthenticated user clicks Send Message", async () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "", pathname: "/listing/macbook-pro" },
    });

    render(<ContactButtons {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(window.location.href).toContain("/auth/login");
    });
  });
});

describe("ContactButtons — WhatsApp", () => {
  it("renders WhatsApp link when whatsappNumber is provided", () => {
    render(<ContactButtons {...baseProps} whatsappNumber="+35799123456" />);
    expect(
      screen.getByRole("link", { name: /chat on whatsapp/i }),
    ).toBeInTheDocument();
  });

  it("does NOT render WhatsApp link when whatsappNumber is null", () => {
    render(<ContactButtons {...baseProps} whatsappNumber={null} />);
    expect(
      screen.queryByRole("link", { name: /chat on whatsapp/i }),
    ).toBeNull();
  });

  it("WhatsApp link opens in a new tab", () => {
    render(<ContactButtons {...baseProps} whatsappNumber="+35799123456" />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("WhatsApp href uses wa.me domain", () => {
    render(<ContactButtons {...baseProps} whatsappNumber="+35799123456" />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\//);
  });

  it("WhatsApp href strips spaces and dashes from the phone number", () => {
    render(<ContactButtons {...baseProps} whatsappNumber="+357 99-123 456" />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const href = link.getAttribute("href") ?? "";
    // The path segment should contain the cleaned number (no spaces/dashes)
    expect(href).toContain("+35799123456");
    expect(href).not.toMatch(/[\s-]/);
  });

  it("WhatsApp href encodes the listing title in the pre-filled message", () => {
    render(
      <ContactButtons
        {...baseProps}
        whatsappNumber="+35799000000"
        listingTitle="MacBook Pro"
      />,
    );
    const href =
      screen
        .getByRole("link", { name: /chat on whatsapp/i })
        .getAttribute("href") ?? "";
    expect(href).toContain(encodeURIComponent("MacBook Pro"));
  });
});

describe("ContactButtons — Telegram", () => {
  it("renders Telegram link when telegramUsername is provided", () => {
    render(<ContactButtons {...baseProps} telegramUsername="johndoe" />);
    expect(
      screen.getByRole("link", { name: /message on telegram/i }),
    ).toBeInTheDocument();
  });

  it("does NOT render Telegram link when telegramUsername is null", () => {
    render(<ContactButtons {...baseProps} telegramUsername={null} />);
    expect(
      screen.queryByRole("link", { name: /message on telegram/i }),
    ).toBeNull();
  });

  it("Telegram link opens in a new tab", () => {
    render(<ContactButtons {...baseProps} telegramUsername="seller" />);
    const link = screen.getByRole("link", { name: /message on telegram/i });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("Telegram href is https://t.me/{username}", () => {
    render(<ContactButtons {...baseProps} telegramUsername="cyprusSeller" />);
    const href = screen
      .getByRole("link", { name: /message on telegram/i })
      .getAttribute("href");
    expect(href).toBe("https://t.me/cyprusSeller");
  });
});

describe("ContactButtons — Phone number reveal", () => {
  it("renders phone button when contactPhone is provided", () => {
    render(<ContactButtons {...baseProps} contactPhone="+357 99 000 111" />);
    expect(
      screen.getByRole("button", { name: /show phone number/i }),
    ).toBeInTheDocument();
  });

  it("does NOT render phone button when contactPhone is null", () => {
    render(<ContactButtons {...baseProps} contactPhone={null} />);
    expect(
      screen.queryByRole("button", { name: /show phone number/i }),
    ).toBeNull();
  });

  it("reveals the phone number on click", () => {
    render(<ContactButtons {...baseProps} contactPhone="+357 99 000 111" />);
    const btn = screen.getByRole("button", { name: /show phone number/i });
    fireEvent.click(btn);
    expect(screen.getByText("+357 99 000 111")).toBeInTheDocument();
  });
});
