"use client";

import { ChevronLeft, ChevronRight, Maximize2, Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type GalleryImage = {
  url: string;
  sort_order: number;
};

type MediaItem =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string };

export default function ImageGallery({
  images,
  title,
  videoUrl,
}: {
  images: GalleryImage[];
  title: string;
  videoUrl?: string | null;
}) {
  // Build unified media list: video first (if present), then images
  const media: MediaItem[] = [
    ...(videoUrl ? [{ kind: "video" as const, url: videoUrl }] : []),
    ...images.map((img) => ({ kind: "image" as const, url: img.url })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  if (media.length === 0) {
    return (
      <div className="relative aspect-video max-h-130 bg-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
        <span className="text-6xl">📷</span>
      </div>
    );
  }

  const active = media[activeIndex];

  return (
    <>
      {/* ── Main viewer ─────────────────────────────────────────────── */}
      <div className="relative aspect-video max-h-130 bg-gray-900 rounded-2xl overflow-hidden group">
        {active.kind === "video" ? (
          <video
            ref={videoRef}
            key={active.url}
            src={active.url}
            className="w-full h-full object-contain"
            controls
            preload="metadata"
          />
        ) : (
          <Image
            src={active.url}
            alt={`${title} — photo ${activeIndex + 1 - (videoUrl ? 1 : 0)}`}
            fill
            loading="eager"
            className="object-contain"
            priority={activeIndex === 0}
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        )}

        {/* Nav arrows — hide over video controls */}
        {media.length > 1 && active.kind !== "video" && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter */}
        {media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
            {activeIndex + 1} / {media.length}
          </div>
        )}

        {/* Zoom — images only */}
        {active.kind === "image" && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Video badge on first item */}
        {active.kind === "video" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-violet-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full pointer-events-none">
            <Play className="w-3 h-3 fill-white" />
            Video Tour
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ──────────────────────────────────────────── */}
      {media.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
          {media.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                idx === activeIndex
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {item.kind === "video" ? (
                /* Video thumbnail — dark bg with play icon */
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}

              {/* "VIDEO" label overlay */}
              {item.kind === "video" && (
                <div className="absolute bottom-0 inset-x-0 bg-violet-600 text-white text-[9px] font-bold text-center py-0.5 tracking-wide">
                  VIDEO
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox (images only) ───────────────────────────────────── */}
      {lightboxOpen && active.kind === "image" && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.url}
              alt={`${title}`}
              fill
              loading="eager"
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium">
            {activeIndex + 1} / {media.length}
          </div>
        </div>
      )}
    </>
  );
}
