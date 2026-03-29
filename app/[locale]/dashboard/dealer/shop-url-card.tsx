"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  slug: string;
};

export default function ShopUrlCard({ slug }: Props) {
  const [copied, setCopied] = useState(false);

  function copyShopUrl() {
    const url = `${window.location.origin}/shop/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border border-[#e8e6e3] p-5">
      <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">
        Your Shop URL
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[#faf9f7] px-4 py-2.5 text-sm text-[#666] font-mono truncate border border-[#e8e6e3]">
          {typeof window !== "undefined" ? window.location.origin : ""}
          /shop/{slug}
        </div>
        <button
          onClick={copyShopUrl}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-[#2C2826] text-white hover:bg-[#3D3633] transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
