"use client";

import { Loader2, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import ShopOnboardingWizard from "./shop-onboarding-wizard";

interface Props {
  stripeSessionId: string;
  userId: string;
  userName: string;
  alreadyOnboarded: boolean;
  shopName: string;
  shopSlug: string;
}

/**
 * Wraps the onboarding wizard with a Stripe session verification step.
 * When users land here after Stripe Checkout, we need to verify their
 * payment before showing the wizard.
 */
export default function ShopOnboardingClient({
  stripeSessionId,
  ...wizardProps
}: Props) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("/api/dealer/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: stripeSessionId }),
        });
        const data = await res.json();

        if (data.status === "activated" || data.status === "already_active") {
          setVerified(true);
          toast.success("Payment confirmed!", {
            description: "Let's set up your shop.",
          });
        } else {
          setError(data.error || "Payment verification failed");
        }
      } catch {
        setError("Network error — could not verify your payment.");
      } finally {
        setVerifying(false);
      }
    }
    verify();
  }, [stripeSessionId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0eeeb]/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#e8e6e3] flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-[#8E7A6B]" />
          </div>
          <div className="flex items-center gap-2 text-[#666]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">
              Confirming your payment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0eeeb]/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            Something went wrong
          </h2>
          <p className="text-sm text-[#6b6560]">{error}</p>
          <button
            onClick={() => router.push("/pro-sellers")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors"
          >
            Back to Pro Sellers
          </button>
        </div>
      </div>
    );
  }

  if (verified) {
    return <ShopOnboardingWizard {...wizardProps} />;
  }

  return null;
}
