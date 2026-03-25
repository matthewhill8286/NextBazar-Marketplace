/**
 * Centralised list of Pro Seller features used by every CTA & marketing surface.
 * Grouped into categories so UIs can render them flat or sectioned.
 */

export type FeatureGroup = {
  heading: string;
  items: string[];
};

export const PRO_SELLER_FEATURE_GROUPS: FeatureGroup[] = [
  {
    heading: "Seller Credibility",
    items: [
      "Verified Pro Seller badge",
      "Branded shop page with custom URL",
      "Custom logo & banner",
      "Accent colour theming",
    ],
  },
  {
    heading: "Efficiency Tools",
    items: [
      "Unlimited listings",
      "Bulk edit & status updates",
      "Auto-renewal of expiring listings",
      "3 free Quick Boosts per month",
    ],
  },
  {
    heading: "Insights & Analytics",
    items: [
      "Views, saves & click-through stats",
      "Top-performing listings dashboard",
      "Best time to post recommendations",
    ],
  },
  {
    heading: "Communication",
    items: ["Quick-reply message templates", "Response time badge"],
  },
];

/** Flat list for compact UIs (e.g. the subscribe CTA grid). */
export const PRO_SELLER_FEATURES: string[] = PRO_SELLER_FEATURE_GROUPS.flatMap(
  (g) => g.items,
);
