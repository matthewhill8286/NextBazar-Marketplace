import type { ReactNode } from "react";

/**
 * Standalone layout for onboarding — no navbar or footer.
 * The wizard provides its own top bar with the logo and step indicator.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
