"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Props = {
  /** Feature name shown in the gate message */
  feature: string;
  /** Current plan tier label (e.g. "Starter", "Pro") */
  currentPlan: string;
  /** Minimum required plan label (e.g. "Pro", "Business") */
  requiredPlan: string;
  /** If true, renders children; if false, shows the gate */
  allowed: boolean;
  /** Optional: render children behind a blur overlay instead of hiding */
  blur?: boolean;
  children: React.ReactNode;
};

/**
 * Feature gate wrapper. Shows children when `allowed` is true;
 * otherwise shows an upgrade prompt or blurs the content.
 */
export default function UpgradeGate({
  feature,
  currentPlan,
  requiredPlan,
  allowed,
  blur = false,
  children,
}: Props) {
  if (allowed) return <>{children}</>;

  if (blur) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <GateCard feature={feature} requiredPlan={requiredPlan} />
        </div>
      </div>
    );
  }

  return <GateCard feature={feature} requiredPlan={requiredPlan} />;
}

function GateCard({
  feature,
  requiredPlan,
}: {
  feature: string;
  requiredPlan: string;
}) {
  return (
    <div className="bg-[#faf9f7] border border-[#e8e6e3] p-8 text-center max-w-md mx-auto">
      <div className="w-12 h-12 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-[#8E7A6B]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
        {feature}
      </h3>
      <p className="text-sm text-[#6b6560] mb-5">
        Upgrade to {requiredPlan} to unlock this feature and take your
        selling to the next level.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.1em] uppercase px-6 py-3 hover:bg-[#7A6657] transition-colors"
      >
        Upgrade to {requiredPlan}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
