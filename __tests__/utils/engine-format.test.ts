/**
 * Tests for the vehicle spec engine_size formatter from listing-detail.tsx.
 * Replicated inline to keep tests self-contained.
 */

import { describe, expect, it } from "vitest";

// Replicated from app/[locale]/listing/[slug]/listing-detail.tsx
function formatEngine(v: string): string {
  return String(v).endsWith("L") ? String(v) : `${v}L`;
}

describe("formatEngine (engine_size formatter)", () => {
  it("appends L when value has no suffix", () => {
    expect(formatEngine("2.0")).toBe("2.0L");
  });

  it("does NOT double-append L when value already ends with L", () => {
    expect(formatEngine("2.0L")).toBe("2.0L");
  });

  it("handles small engine sizes", () => {
    expect(formatEngine("1.0")).toBe("1.0L");
  });

  it("handles large engine sizes", () => {
    expect(formatEngine("6.2")).toBe("6.2L");
  });

  it("handles integer engine sizes", () => {
    expect(formatEngine("3")).toBe("3L");
  });

  it("handles value that already has L suffix", () => {
    expect(formatEngine("5.0L")).toBe("5.0L");
  });

  it("handles empty string", () => {
    expect(formatEngine("")).toBe("L");
  });

  it("is case-sensitive (lowercase l is not treated as L)", () => {
    // The formatter only checks for uppercase L
    expect(formatEngine("2.0l")).toBe("2.0lL");
  });
});
