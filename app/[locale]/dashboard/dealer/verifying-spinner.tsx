"use client";

import { Loader2 } from "lucide-react";

export default function VerifyingSpinner() {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Setting up your Pro Seller account...
      </h2>
      <p className="text-gray-500">This only takes a moment.</p>
    </div>
  );
}
