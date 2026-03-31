"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed background video for the homepage hero.
 *
 * - Autoplay muted and looped (mobile-safe)
 * - Falls back to the poster image if the video fails to load
 * - Fades in once the video is ready to avoid a flash of black
 */
export default function HeroVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onCanPlay = () => setReady(true);
    v.addEventListener("canplay", onCanPlay);

    // Attempt autoplay — some browsers block it even when muted
    v.play().catch(() => {
      // Silently fall back to the poster image
    });

    return () => v.removeEventListener("canplay", onCanPlay);
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
