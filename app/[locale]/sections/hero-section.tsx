import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import HeroVideo from "@/app/components/hero-video";
import { Link } from "@/i18n/navigation";

export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <section
      className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#2C2826] dark:bg-[#121010]"
      aria-label="Homepage hero"
    >
      {/* Poster image — always loads first for fast LCP */}
      <Image
        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/hero-poster.jpg`}
        alt="Cyprus beachside"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Background video — fades in over the poster once loaded */}
      <HeroVideo
        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/hero-video.mp4`}
        poster={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/hero-poster.jpg`}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#2C2826]/65 dark:bg-[#121010]/65" />

      {/* Content */}
      <div className="relative w-full max-w-7xl mx-auto px-6 py-24">
        <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-white/80 mb-8">
          {t("hero.badge")}
        </p>

        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[1.05] mb-8 max-w-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t.rich("hero.title", {
            em: (chunks) => (
              <>
                <span className="italic">{chunks}</span>
                <br />
              </>
            ),
          })}
        </h1>

        <p className="text-white/90 text-lg md:text-xl max-w-xl leading-relaxed mb-12">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/post"
            className="group inline-flex items-center gap-3 bg-white dark:bg-[#252220] text-[#1a1a1a] dark:text-[#e8e6e3] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#f0eeeb] dark:hover:bg-[#3a3735] transition-colors"
          >
            {t("hero.postAd")}
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/search"
            className="group inline-flex items-center gap-3 border border-white/60 text-white px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
          >
            {t("hero.browse")}
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
