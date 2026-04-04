import { describe, expect, it } from "vitest";
import {
  FEATURE_FLAGS,
  SOFT_LAUNCH_CATEGORY_SLUGS,
} from "@/lib/feature-flags";

describe("FEATURE_FLAGS", () => {
  it("exports an object with all expected flag keys", () => {
    const keys = Object.keys(FEATURE_FLAGS);
    expect(keys).toContain("LANGUAGE_SWITCHER");
    expect(keys).toContain("CRYPTO_PAYMENTS");
    expect(keys).toContain("DEALERS_PAGE");
    expect(keys).toContain("DEALERS");
    expect(keys).toContain("REPORTS");
    expect(keys).toContain("SOFT_LAUNCH_CATEGORIES");
  });

  it("has all values as booleans", () => {
    for (const [, value] of Object.entries(FEATURE_FLAGS)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("has DEALERS enabled", () => {
    expect(FEATURE_FLAGS.DEALERS).toBe(true);
  });

  it("has DEALERS_PAGE enabled", () => {
    expect(FEATURE_FLAGS.DEALERS_PAGE).toBe(true);
  });

  it("has LANGUAGE_SWITCHER enabled", () => {
    expect(FEATURE_FLAGS.LANGUAGE_SWITCHER).toBe(true);
  });

  it("has CRYPTO_PAYMENTS disabled", () => {
    expect(FEATURE_FLAGS.CRYPTO_PAYMENTS).toBe(false);
  });

  it("has REPORTS disabled", () => {
    expect(FEATURE_FLAGS.REPORTS).toBe(false);
  });

  it("has SOFT_LAUNCH_CATEGORIES enabled", () => {
    expect(FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES).toBe(true);
  });

  it("is readonly (const assertion)", () => {
    // TypeScript enforces this at compile time; at runtime we verify
    // the object shape is stable
    expect(Object.keys(FEATURE_FLAGS).length).toBe(6);
  });
});

describe("SOFT_LAUNCH_CATEGORY_SLUGS", () => {
  it("contains vehicles and property", () => {
    expect(SOFT_LAUNCH_CATEGORY_SLUGS.has("vehicles")).toBe(true);
    expect(SOFT_LAUNCH_CATEGORY_SLUGS.has("property")).toBe(true);
  });

  it("does not contain non-launch categories", () => {
    expect(SOFT_LAUNCH_CATEGORY_SLUGS.has("electronics")).toBe(false);
    expect(SOFT_LAUNCH_CATEGORY_SLUGS.has("furniture")).toBe(false);
  });
});
