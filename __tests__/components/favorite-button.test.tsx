import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FavoriteButton from "@/app/components/favorite-button";

// next-intl — return simple key-based translations so no provider is needed
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ---------------------------------------------------------------------------
// Mock the SavedContext — FavoriteButton is now purely a UI component that
// delegates all state and persistence to the context.
// ---------------------------------------------------------------------------

const mockToggle = vi.fn().mockResolvedValue(undefined);
const mockIsSaved = vi.fn().mockReturnValue(false);

vi.mock("@/lib/saved-context", () => ({
  useSaved: () => ({
    isSaved: mockIsSaved,
    toggle: mockToggle,
    savedIds: new Set<string>(),
    count: 0,
    loading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockIsSaved.mockReturnValue(false);
  mockToggle.mockResolvedValue(undefined);
});

describe("FavoriteButton", () => {
  it("renders a button", () => {
    render(<FavoriteButton listingId="abc" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders Heart icon (SVG inside button)", () => {
    render(<FavoriteButton listingId="abc" />);
    const btn = screen.getByRole("button");
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("shows heart as unfilled when isSaved returns false", () => {
    mockIsSaved.mockReturnValue(false);
    render(<FavoriteButton listingId="abc" />);
    const svg = screen.getByRole("button").querySelector("svg");
    const classes = svg?.getAttribute("class") ?? "";
    expect(classes).not.toContain("fill-red-500");
  });

  it("shows heart as filled (red) when isSaved returns true", () => {
    mockIsSaved.mockReturnValue(true);
    render(<FavoriteButton listingId="abc" />);
    const svg = screen.getByRole("button").querySelector("svg");
    const classes = svg?.getAttribute("class") ?? "";
    expect(classes).toContain("fill-red-500");
  });

  it("calls toggle with the listingId when clicked", async () => {
    render(<FavoriteButton listingId="listing-42" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith("listing-42");
    });
  });

  it("calls toggle exactly once per click", async () => {
    render(<FavoriteButton listingId="listing-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledOnce();
    });
  });

  it("calls isSaved with the correct listingId", () => {
    render(<FavoriteButton listingId="listing-xyz" />);
    expect(mockIsSaved).toHaveBeenCalledWith("listing-xyz");
  });

  it("stops propagation — does not bubble click to parent", () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <FavoriteButton listingId="abc" />
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
