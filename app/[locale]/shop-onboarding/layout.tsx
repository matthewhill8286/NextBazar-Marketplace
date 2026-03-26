import type { ReactNode } from "react";

/**
 * Standalone layout for shop onboarding — no navbar or footer.
 * The wizard provides its own step indicator and branding.
 */
export default function ShopOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
