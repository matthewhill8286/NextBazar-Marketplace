/**
 * __tests__/components/offers-client.test.tsx
 *
 * Tests for BuyerOfferCard and SellerOfferCard — the exported named components
 * that wrap the internal OfferCard with a fixed `isSeller` flag.
 *
 * Covers the `respond()` / `handleDelete()` functions:
 *
 *   1. Successful action  → router.refresh() called, UI updates
 *   2. Supabase error obj → error message shown, loading cleared, buttons re-enabled
 *   3. Supabase throws    → same as (2) — this was the reported bug
 *   4. In-flight state    → action buttons disabled while request is pending
 *
 * Bug fix: `respond()` and `handleDelete()` now use try / catch / finally so
 * `setLoading(null)` always runs.  Before the fix a thrown exception left
 * `disabled={!!loading}` permanently true, making buttons unresponsive.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BuyerOfferCard,
  SellerOfferCard,
} from "@/app/[locale]/dashboard/offers/offers-client";

// ── Hoisted shared state ──────────────────────────────────────────────────
// vi.mock() factories are hoisted above module code.  Any variable the factory
// closure needs must be declared with vi.hoisted() so it exists at hoist time.

const { mockUpdateEq, mockUpdate, mockDeleteEq, mockRefresh } = vi.hoisted(
  () => {
    const mockUpdateEq = vi.fn();
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockRefresh = vi.fn();
    return { mockUpdateEq, mockUpdate, mockDeleteEq, mockRefresh };
  },
);

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) =>
    React.createElement("a", { href, className }, children),
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", props),
}));

vi.mock("@/lib/hooks/use-realtime-table", () => ({
  useRealtimeTable: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { custom: vi.fn(), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
    className?: string;
  }) => React.createElement("a", { href, onClick, className }, children),
}));

vi.mock("@/app/components/leave-review-modal", () => ({ default: () => null }));

/**
 * Supabase builder-chain mock.
 *
 * `from()` returns an object with all standard query methods chained via
 * `mockReturnThis()` (they return the parent object when called as methods),
 * plus the controllable `update` / `delete` mocks that tests interact with.
 */
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      // Query chain — select/eq/order/maybeSingle used by the reviews useEffect
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      // Mutation — used by respond() and handleDelete()
      update: mockUpdate,
      delete: vi.fn().mockReturnValue({ eq: mockDeleteEq }),
    }),
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────

const BASE_LISTING = {
  id: "listing-1",
  title: "Vintage Camera",
  slug: "vintage-camera",
  primary_image_url: null,
  price: 200,
  currency: "EUR",
};

const PENDING_OFFER = {
  id: "offer-1",
  listing_id: "listing-1",
  buyer_id: "user-buyer",
  seller_id: "user-seller",
  amount: 150,
  currency: "EUR",
  status: "pending",
  message: null as string | null,
  counter_amount: null as number | null,
  counter_message: null as string | null,
  responded_at: null as string | null,
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  created_at: new Date().toISOString(),
  listings: BASE_LISTING,
  seller: { id: "user-seller", display_name: "Alice", avatar_url: null },
  buyer: { id: "user-buyer", display_name: "Bob", avatar_url: null },
};

const COUNTERED_OFFER = {
  ...PENDING_OFFER,
  id: "offer-2",
  status: "countered",
  counter_amount: 175,
  counter_message: "Best I can do",
};

// ── Shared render helpers ─────────────────────────────────────────────────

const onUpdateAction = vi.fn();
const onDeleteAction = vi.fn();

function renderBuyer(offer = PENDING_OFFER) {
  return render(
    <BuyerOfferCard
      offer={offer}
      userId="user-buyer"
      onUpdateAction={onUpdateAction}
      onDeleteAction={onDeleteAction}
    />,
  );
}

function renderSeller(offer = PENDING_OFFER) {
  return render(
    <SellerOfferCard
      offer={offer}
      userId="user-seller"
      onUpdateAction={onUpdateAction}
      onDeleteAction={onDeleteAction}
    />,
  );
}

/** Expand the card by clicking the amount span in the header (not the Link). */
async function expand(waitFor_text: string | RegExp = /Withdraw offer/i) {
  // "€150" is a plain <span> inside the clickable header div.
  // The listing title Link has stopPropagation, so we click the amount instead.
  fireEvent.click(screen.getByText("€150"));
  await waitFor(() =>
    expect(screen.getByText(waitFor_text)).toBeInTheDocument(),
  );
}

/**
 * Click an action button and then confirm in the ConfirmDialog.
 * Actions now go through a ConfirmDialog — button click opens the dialog,
 * then we click the confirm button inside it.
 *
 * dialogTitle is used to wait for the dialog to appear; confirmLabel targets
 * the actual confirm button inside the dialog.
 */
async function clickAndConfirm(
  actionText: string | RegExp,
  dialogTitle: string | RegExp,
  confirmLabel: string | RegExp,
) {
  fireEvent.click(screen.getByText(actionText));
  // Wait for confirm dialog to appear
  await waitFor(() =>
    expect(screen.getByText(dialogTitle)).toBeInTheDocument(),
  );
  // The confirm button is inside the dialog; grab all matches and pick the last one
  // (the first might be the original action button, the second is the dialog's confirm)
  const buttons = screen.getAllByText(confirmLabel);
  fireEvent.click(buttons[buttons.length - 1]);
}

// ── Setup ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  onUpdateAction.mockReset();
  onDeleteAction.mockReset();
  // Default: successful update
  mockUpdateEq.mockResolvedValue({ error: null });
  mockDeleteEq.mockResolvedValue({ error: null });
});

// ═════════════════════════════════════════════════════════════════════════════
// BuyerOfferCard — pending offer
// ═════════════════════════════════════════════════════════════════════════════

describe("BuyerOfferCard — withdraw pending offer", () => {
  it("renders the Withdraw button when the offer is pending", async () => {
    renderBuyer();
    await expand();
    expect(screen.getByText(/Withdraw offer/i)).toBeInTheDocument();
  });

  it("sends status=withdrawn to Supabase on click", async () => {
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "withdrawn" }),
      ),
    );
  });

  it("calls router.refresh() after a successful withdraw", async () => {
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("calls onUpdate with the new status after success", async () => {
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    await waitFor(() =>
      expect(onUpdateAction).toHaveBeenCalledWith(
        "offer-1",
        expect.objectContaining({ status: "withdrawn" }),
      ),
    );
  });

  it("shows error message when Supabase returns an error object", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "RLS violation" } });
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't update offer/i)).toBeInTheDocument(),
    );
  });

  it("re-enables the Withdraw button after a Supabase error object", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "RLS violation" } });
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't update offer/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Withdraw offer/i).closest("button"),
    ).not.toBeDisabled();
  });

  it("(bug regression) clears loading and shows error when Supabase throws", async () => {
    mockUpdateEq.mockRejectedValue(new Error("network failure"));
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't update offer/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Withdraw offer/i).closest("button"),
    ).not.toBeDisabled();
  });

  it("disables the Withdraw button while the request is in-flight", async () => {
    let settle!: (v: { error: null }) => void;
    mockUpdateEq.mockImplementation(
      () =>
        new Promise<{ error: null }>((res) => {
          settle = res;
        }),
    );
    renderBuyer();
    await expand();
    await clickAndConfirm(/Withdraw offer/i, /Withdraw this offer/, /^Withdraw$/);
    // The Withdraw confirm button in the dialog should be in loading state
    await waitFor(() =>
      expect(
        screen.getByText(/Withdraw offer/i).closest("button"),
      ).toBeDisabled(),
    );
    // Resolve to clean up the hanging promise
    settle({ error: null });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BuyerOfferCard — countered offer (Accept counter / Decline)
// ═════════════════════════════════════════════════════════════════════════════

describe("BuyerOfferCard — accept / decline counter offer", () => {
  it("renders Accept and Decline buttons for a countered offer", async () => {
    renderBuyer(COUNTERED_OFFER);
    await expand();
    expect(screen.getByText(/Accept €175/i)).toBeInTheDocument();
    expect(screen.getByText(/^Decline$/i)).toBeInTheDocument();
  });

  it("sends status=accepted when Accept counter is clicked", async () => {
    renderBuyer(COUNTERED_OFFER);
    await expand();
    await clickAndConfirm(/Accept €175/i, /Accept this offer/, /^Accept$/);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "accepted" }),
      ),
    );
  });

  it("sends status=declined when Decline is clicked", async () => {
    renderBuyer(COUNTERED_OFFER);
    await expand();
    await clickAndConfirm(/^Decline$/i, /Decline this offer/, /^Decline$/);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "declined" }),
      ),
    );
  });

  it("(bug regression) re-enables Accept and Decline after a thrown exception", async () => {
    mockUpdateEq.mockRejectedValue(new Error("timeout"));
    renderBuyer(COUNTERED_OFFER);
    await expand();
    await clickAndConfirm(/Accept €175/i, /Accept this offer/, /^Accept$/);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't update offer/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Accept €175/i).closest("button"),
    ).not.toBeDisabled();
    expect(screen.getByText(/^Decline$/i).closest("button")).not.toBeDisabled();
  });

  it("disables all action buttons while the request is in-flight", async () => {
    let settle!: (v: { error: null }) => void;
    mockUpdateEq.mockImplementation(
      () =>
        new Promise<{ error: null }>((res) => {
          settle = res;
        }),
    );
    renderBuyer(COUNTERED_OFFER);
    await expand();
    await clickAndConfirm(/Accept €175/i, /Accept this offer/, /^Accept$/);
    await waitFor(() =>
      expect(screen.getByText(/Accept €175/i).closest("button")).toBeDisabled(),
    );
    // Withdraw is blocked by the same !!loading guard
    expect(
      screen.getByText(/Withdraw offer/i).closest("button"),
    ).toBeDisabled();
    settle({ error: null });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SellerOfferCard — Accept / Counter / Decline
// ═════════════════════════════════════════════════════════════════════════════

describe("SellerOfferCard — accept / decline incoming offer", () => {
  it("renders Accept, Counter, and Decline buttons for a pending offer", async () => {
    renderSeller();
    await expand(/^Accept$/);
    expect(screen.getByText(/^Accept$/)).toBeInTheDocument();
    expect(screen.getByText(/^Decline$/)).toBeInTheDocument();
    expect(screen.getByText(/Counter/i)).toBeInTheDocument();
  });

  it("sends status=accepted when Accept is clicked", async () => {
    renderSeller();
    await expand(/^Accept$/);
    await clickAndConfirm(/^Accept$/, /Accept this offer/, /^Accept$/);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "accepted" }),
      ),
    );
  });

  it("sends status=declined when Decline is clicked", async () => {
    renderSeller();
    await expand(/^Accept$/);
    await clickAndConfirm(/^Decline$/, /Decline this offer/, /^Decline$/);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "declined" }),
      ),
    );
  });

  it("calls router.refresh() after a successful accept", async () => {
    renderSeller();
    await expand(/^Accept$/);
    await clickAndConfirm(/^Accept$/, /Accept this offer/, /^Accept$/);
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("shows error and re-enables buttons when Supabase returns an error object", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "forbidden" } });
    renderSeller();
    await expand(/^Accept$/);
    await clickAndConfirm(/^Decline$/, /Decline this offer/, /^Decline$/);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't update offer/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/^Accept$/).closest("button")).not.toBeDisabled();
    expect(screen.getByText(/^Decline$/).closest("button")).not.toBeDisabled();
  });

  it("(bug regression) re-enables Accept / Decline after a thrown exception", async () => {
    mockUpdateEq.mockRejectedValue(new Error("network failure"));
    renderSeller();
    await expand(/^Accept$/);
    await clickAndConfirm(/^Accept$/, /Accept this offer/, /^Accept$/);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't update offer/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/^Accept$/).closest("button")).not.toBeDisabled();
    expect(screen.getByText(/^Decline$/).closest("button")).not.toBeDisabled();
  });

  it("disables Accept and Decline while the request is in-flight", async () => {
    let settle!: (v: { error: null }) => void;
    mockUpdateEq.mockImplementation(
      () =>
        new Promise<{ error: null }>((res) => {
          settle = res;
        }),
    );
    renderSeller();
    await expand(/^Accept$/);
    await clickAndConfirm(/^Accept$/, /Accept this offer/, /^Accept$/);
    await waitFor(() =>
      expect(screen.getByText(/^Accept$/).closest("button")).toBeDisabled(),
    );
    expect(screen.getByText(/^Decline$/).closest("button")).toBeDisabled();
    settle({ error: null });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("sends a counter offer with amount and message", async () => {
    renderSeller();
    await expand(/^Accept$/);
    fireEvent.click(screen.getByText(/Counter/i));
    // Counter form appears
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Amount/i)).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/Amount/i), {
      target: { value: "180" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Optional message/i), {
      target: { value: "How about €180?" },
    });
    // Click Send Counter in the form — this opens the ConfirmDialog
    await clickAndConfirm(/Send Counter/i, /Send counter offer/, /Send Counter/);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "countered",
          counter_amount: 180,
          counter_message: "How about €180?",
        }),
      ),
    );
  });
});
