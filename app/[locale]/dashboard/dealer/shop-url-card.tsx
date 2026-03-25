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
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Your Shop URL
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-mono truncate border border-gray-100">
          {typeof window !== "undefined" ? window.location.origin : ""}
          /shop/{slug}
        </div>
        <button
          onClick={copyShopUrl}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
