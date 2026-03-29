"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useSaved } from "@/lib/saved-context";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const { isSaved, toggle } = useSaved();
  const [animating, setAnimating] = useState(false);
  const saved = isSaved(listingId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    await toggle(listingId);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <button
      className="absolute top-2.5 right-2.5 p-2 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors z-10"
      onClick={handleClick}
    >
      <Heart
        className={`w-4 h-4 transition-transform ${animating ? "scale-125" : ""} ${
          saved ? "text-red-500 fill-red-500" : "text-[#666]"
        }`}
      />
    </button>
  );
}
