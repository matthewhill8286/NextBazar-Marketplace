"use client";

import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Play,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

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
  listingStatus,
  offerStatus,
}: {
  images: GalleryImage[];
  title: string;
  videoUrl?: string | null;
  listingStatus?: string | null;
  offerStatus?: string | null;
}) {
  const t = useTranslations("listing.gallery");
  const media: MediaItem[] = [
    ...(videoUrl ? [{ kind: "video" as const, url: videoUrl }] : []),
    ...images.map((img) => ({ kind: "image" as const, url: img.url })),
  ];

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goNext, goPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  // ── Empty state ────────────────────────────────────────────────────
  if (media.length === 0) {
    return (
      <div className="relative aspect-video max-h-[520px] bg-[#f0eeeb] overflow-hidden flex flex-col items-center justify-center gap-3 rounded-xl">
        <Camera className="w-12 h-12 text-[#8a8280]" />
        <span className="text-sm text-[#8a8280] font-medium">
          {t("noPhotos")}
        </span>
      </div>
    );
  }

  const active = media[lightboxIndex];
  const totalExtra = media.length - 5;

  // ── Status overlay (used by both grid and lightbox) ─────────────────
  function StatusOverlays() {
    return (
      <>
        {listingStatus === "sold" && (
          <>
            <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-4 border-white/80 px-8 py-3 rotate-[-12deg] select-none">
                <span className="text-white font-black text-4xl uppercase tracking-[0.25em] drop-shadow-sm">
                  {t("sold")}
                </span>
              </div>
            </div>
          </>
        )}
        {listingStatus !== "sold" && offerStatus && (
          <div className="absolute top-3 left-3 pointer-events-none z-10">
            {offerStatus === "accepted" && (
              <span className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {t("offerAccepted")}
              </span>
            )}
            {offerStatus === "countered" && (
              <span className="flex items-center gap-1.5 bg-[#8E7A6B]/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {t("counterOffer")}
              </span>
            )}
            {offerStatus === "pending" && (
              <span className="flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {t("offerPending")}
              </span>
            )}
          </div>
        )}
      </>
    );
  }

  // ── Single media cell renderer ──────────────────────────────────────
  function MediaCell({
    item,
    idx,
    className = "",
    sizes,
    priority = false,
  }: {
    item: MediaItem;
    idx: number;
    className?: string;
    sizes: string;
    priority?: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={() => openLightbox(idx)}
        className={`relative overflow-hidden bg-[#2C2826] group/cell cursor-pointer ${className}`}
      >
        {item.kind === "video" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2C2826]">
            {/* Show first frame as poster if possible */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3D3633] to-[#2C2826]" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/cell:bg-white/30 transition-colors">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
              <span className="text-white/80 text-xs font-medium">
                {t("videoTour")}
              </span>
            </div>
          </div>
        ) : (
          <>
            <Image
              src={item.url}
              alt={`${title} — photo ${idx + 1}`}
              fill
              loading={priority ? "eager" : "lazy"}
              className="object-cover group-hover/cell:scale-105 transition-transform duration-500"
              priority={priority}
              sizes={sizes}
            />
            {/* Subtle hover dim */}
            <div className="absolute inset-0 bg-black/0 group-hover/cell:bg-black/10 transition-colors duration-300" />
          </>
        )}
      </button>
    );
  }

  // ── Grid layouts based on image count ───────────────────────────────

  // 1 image: full width hero
  if (media.length === 1) {
    return (
      <>
        <div className="relative rounded-xl overflow-hidden">
          <div className="relative aspect-video max-h-130">
            <MediaCell
              item={media[0]}
              idx={0}
              className="absolute inset-0 rounded-xl h-full w-full"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
            <StatusOverlays />
          </div>
        </div>
        <Lightbox
          media={media}
          active={active}
          lightboxIndex={lightboxIndex}
          lightboxOpen={lightboxOpen}
          setLightboxOpen={setLightboxOpen}
          goNext={goNext}
          goPrev={goPrev}
          setLightboxIndex={setLightboxIndex}
          title={title}
          videoRef={videoRef}
        />
      </>
    );
  }

  // 2 images: side by side
  if (media.length === 2) {
    return (
      <>
        <div className="relative rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-2 gap-1 max-h-[520px]"
            style={{ aspectRatio: "16/9" }}
          >
            <MediaCell
              item={media[0]}
              idx={0}
              className="rounded-l-xl"
              sizes="50vw"
              priority
            />
            <MediaCell
              item={media[1]}
              idx={1}
              className="rounded-r-xl"
              sizes="50vw"
            />
          </div>
          <StatusOverlays />
        </div>
        <Lightbox
          media={media}
          active={active}
          lightboxIndex={lightboxIndex}
          lightboxOpen={lightboxOpen}
          setLightboxOpen={setLightboxOpen}
          goNext={goNext}
          goPrev={goPrev}
          setLightboxIndex={setLightboxIndex}
          title={title}
          videoRef={videoRef}
        />
      </>
    );
  }

  // 3 images: hero left + 2 stacked right
  if (media.length === 3) {
    return (
      <>
        <div className="relative rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-2 gap-1 max-h-[520px]"
            style={{ aspectRatio: "16/9" }}
          >
            <MediaCell
              item={media[0]}
              idx={0}
              className="row-span-2 rounded-l-xl"
              sizes="50vw"
              priority
            />
            <MediaCell
              item={media[1]}
              idx={1}
              className="rounded-tr-xl"
              sizes="25vw"
            />
            <MediaCell
              item={media[2]}
              idx={2}
              className="rounded-br-xl"
              sizes="25vw"
            />
          </div>
          <StatusOverlays />
        </div>
        <Lightbox
          media={media}
          active={active}
          lightboxIndex={lightboxIndex}
          lightboxOpen={lightboxOpen}
          setLightboxOpen={setLightboxOpen}
          goNext={goNext}
          goPrev={goPrev}
          setLightboxIndex={setLightboxIndex}
          title={title}
          videoRef={videoRef}
        />
      </>
    );
  }

  // 4 images: hero left + 3 right (1 top, 2 bottom)
  if (media.length === 4) {
    return (
      <>
        <div className="relative rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-4 grid-rows-2 gap-1 max-h-[520px]"
            style={{ aspectRatio: "16/9" }}
          >
            <MediaCell
              item={media[0]}
              idx={0}
              className="col-span-2 row-span-2 rounded-l-xl"
              sizes="50vw"
              priority
            />
            <MediaCell
              item={media[1]}
              idx={1}
              className="col-span-2 rounded-tr-xl"
              sizes="25vw"
            />
            <MediaCell item={media[2]} idx={2} className="" sizes="25vw" />
            <MediaCell
              item={media[3]}
              idx={3}
              className="rounded-br-xl"
              sizes="25vw"
            />
          </div>
          <StatusOverlays />
        </div>
        <Lightbox
          media={media}
          active={active}
          lightboxIndex={lightboxIndex}
          lightboxOpen={lightboxOpen}
          setLightboxOpen={setLightboxOpen}
          goNext={goNext}
          goPrev={goPrev}
          setLightboxIndex={setLightboxIndex}
          title={title}
          videoRef={videoRef}
        />
      </>
    );
  }

  // 5+ images: Airbnb grid — hero left (col-span-2 row-span-2), 4 smaller on right in 2×2
  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        <div
          className="grid grid-cols-4 grid-rows-2 gap-1 max-h-[520px]"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Hero — takes left half */}
          <MediaCell
            item={media[0]}
            idx={0}
            className="col-span-2 row-span-2 rounded-l-xl"
            sizes="(max-width: 1280px) 50vw, 640px"
            priority
          />

          {/* Top-right pair */}
          <MediaCell
            item={media[1]}
            idx={1}
            className=""
            sizes="(max-width: 1280px) 25vw, 320px"
          />
          <MediaCell
            item={media[2]}
            idx={2}
            className="rounded-tr-xl"
            sizes="(max-width: 1280px) 25vw, 320px"
          />

          {/* Bottom-right pair */}
          <MediaCell
            item={media[3]}
            idx={3}
            className=""
            sizes="(max-width: 1280px) 25vw, 320px"
          />
          <div className="relative rounded-br-xl overflow-hidden">
            <MediaCell
              item={media[4]}
              idx={4}
              className="absolute inset-0"
              sizes="(max-width: 1280px) 25vw, 320px"
            />
            {/* "+N more" overlay on last visible cell */}
            {totalExtra > 0 && (
              <button
                type="button"
                onClick={() => openLightbox(4)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 hover:bg-black/50 transition-colors cursor-pointer"
              >
                <span className="text-white font-semibold text-sm">
                  {t("moreCount", { count: totalExtra })}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Status overlays on the hero area */}
        <StatusOverlays />

        {/* "Show all photos" button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-[#1a1a1a] text-xs font-semibold pl-3 pr-4 py-2 rounded-lg shadow-md hover:bg-white transition-colors"
          >
            <Grid2x2 className="w-4 h-4" />
            {t("showAllPhotos")}
          </button>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        media={media}
        active={active}
        lightboxIndex={lightboxIndex}
        lightboxOpen={lightboxOpen}
        setLightboxOpen={setLightboxOpen}
        goNext={goNext}
        goPrev={goPrev}
        setLightboxIndex={setLightboxIndex}
        title={title}
        videoRef={videoRef}
      />
    </>
  );
}

// ── Lightbox component ─────────────────────────────────────────────────
function Lightbox({
  media,
  active,
  lightboxIndex,
  lightboxOpen,
  setLightboxOpen,
  goNext,
  goPrev,
  setLightboxIndex,
  title,
  videoRef,
}: {
  media: MediaItem[];
  active: MediaItem;
  lightboxIndex: number;
  lightboxOpen: boolean;
  setLightboxOpen: (v: boolean) => void;
  goNext: () => void;
  goPrev: () => void;
  setLightboxIndex: (v: number) => void;
  title: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  if (!lightboxOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={() => setLightboxOpen(false)}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/80 text-sm font-medium">
          {lightboxIndex + 1} / {media.length}
        </span>
        <button
          aria-label="Close image viewer"
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(false);
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {/* Nav arrows */}
        {media.length > 1 && (
          <>
            <button
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 z-10 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 z-10 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Current media */}
        <div
          className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {active.kind === "video" ? (
            // biome-ignore lint/a11y/useMediaCaption: no captions
            <video
              ref={videoRef}
              key={active.url}
              src={active.url}
              className="w-full h-full object-contain"
              controls
              autoPlay
              preload="metadata"
            />
          ) : (
            <Image
              src={active.url}
              alt={`${title} — photo ${lightboxIndex + 1}`}
              fill
              loading="eager"
              className="object-contain"
              sizes="100vw"
            />
          )}
        </div>
      </div>

      {/* Thumbnail strip at bottom */}
      {media.length > 1 && (
        <div
          className="shrink-0 px-4 py-3 flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar max-w-3xl">
            {media.map((item, idx) => (
              <button
                key={item.url}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`relative w-16 h-12 overflow-hidden shrink-0 rounded transition-all ${
                  idx === lightboxIndex
                    ? "ring-2 ring-white opacity-100"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                {item.kind === "video" ? (
                  <div className="w-full h-full bg-[#2C2826] flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
