"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="font-['Playfair_Display',serif] text-2xl text-[#1a1a1a] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#6b6560] mb-6 text-sm">{t("desc")}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-[#8E7A6B] text-white text-xs uppercase tracking-[0.15em] hover:bg-[#7A6657] transition-colors"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
