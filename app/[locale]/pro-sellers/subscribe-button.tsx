"use client";

import { ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";

type Props = {
  label: string;
  /** "primary" = taupe bg, "white" = white bg (for use on dark sections) */
  variant?: "primary" | "white";
};

export default function DealersSubscribeButton({
  label,
  variant = "primary",
}: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const [subscribing, setSubscribing] = useState(false);

  async function handleClick() {
    // If not logged in, send to signup first
    if (!userId) {
      router.push("/auth/signup?redirect=/pro-sellers");
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        console.error("Subscribe error:", error);
        setSubscribing(false);
      }
    } catch {
      setSubscribing(false);
    }
  }

  const base =
    "inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 transition-colors disabled:opacity-50";
  const styles =
    variant === "white"
      ? `${base} bg-white text-[#2C2826] hover:bg-[#f0eeeb]`
      : `${base} bg-[#8E7A6B] text-white hover:bg-[#7A6657]`;

  return (
    <button onClick={handleClick} disabled={subscribing} className={styles}>
      {subscribing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : variant === "white" ? (
        <CreditCard className="w-4 h-4" />
      ) : (
        <ArrowRight className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
