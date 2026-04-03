import {
  ArrowRight,
  Globe2,
  Heart,
  Package,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslator } from "@/lib/translations";

export const metadata: Metadata = {
  title: "About Us — NextBazar",
  description:
    "Learn about NextBazar — the modern marketplace built for Cyprus and beyond.",
};

const TEAM = [
  {
    initials: "MH",
    name: "Matt Hill",
    role: "Co-founder & CTO",
  },
  {
    initials: "YD",
    name: "Yaroslava D.",
    role: "Co-founder & Head Designer",
  },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, "about");
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-6">
            {t("hero.badge")}
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("hero.title")}
          </h1>
          <p className="text-lg text-[#6b6560] max-w-2xl mx-auto mb-12 leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
          >
            {t("hero.browseListings")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#e8e6e3]">
          <div className="bg-white p-8 text-center">
            <div
              className="text-3xl font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              10,000+
            </div>
            <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6b6560]">
              {t("stats.activeListings")}
            </div>
          </div>
          <div className="bg-white p-8 text-center">
            <div
              className="text-3xl font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              25,000+
            </div>
            <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6b6560]">
              {t("stats.registeredUsers")}
            </div>
          </div>
          <div className="bg-white p-8 text-center">
            <div
              className="text-3xl font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              12
            </div>
            <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6b6560]">
              {t("stats.citiesCovered")}
            </div>
          </div>
          <div className="bg-white p-8 text-center">
            <div
              className="text-3xl font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              50,000+
            </div>
            <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6b6560]">
              {t("stats.successfulDeals")}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-[#2C2826] p-10 md:p-16 text-white">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/40 mb-6">
            {t("mission.badge")}
          </p>
          <h2
            className="text-2xl md:text-3xl font-light mb-6 leading-[1.2]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("mission.title")}
          </h2>
          <p className="text-white/60 leading-relaxed text-lg max-w-2xl">
            {t("mission.desc")}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] text-center mb-4">
          {t("values.badge")}
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-12 text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("values.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          <div className="bg-white p-8 flex gap-5">
            <div className="w-11 h-11 bg-[#faf9f7] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#8E7A6B]" />
            </div>
            <div>
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("values.trustTitle")}
              </h3>
              <p className="text-sm text-[#6b6560] leading-relaxed">
                {t("values.trustDesc")}
              </p>
            </div>
          </div>
          <div className="bg-white p-8 flex gap-5">
            <div className="w-11 h-11 bg-[#faf9f7] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-[#8E7A6B]" />
            </div>
            <div>
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("values.speedTitle")}
              </h3>
              <p className="text-sm text-[#6b6560] leading-relaxed">
                {t("values.speedDesc")}
              </p>
            </div>
          </div>
          <div className="bg-white p-8 flex gap-5">
            <div className="w-11 h-11 bg-[#faf9f7] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#8E7A6B]" />
            </div>
            <div>
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("values.communityTitle")}
              </h3>
              <p className="text-sm text-[#6b6560] leading-relaxed">
                {t("values.communityDesc")}
              </p>
            </div>
          </div>
          <div className="bg-white p-8 flex gap-5">
            <div className="w-11 h-11 bg-[#faf9f7] flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5 text-[#8E7A6B]" />
            </div>
            <div>
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("values.localTitle")}
              </h3>
              <p className="text-sm text-[#6b6560] leading-relaxed">
                {t("values.localDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] text-center mb-4">
          {t("team.badge")}
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-12 text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("team.title")}
        </h2>
        <div className="flex flex-wrap justify-center gap-px bg-[#e8e6e3] max-w-md mx-auto">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="bg-white p-8 text-center flex-1 min-w-[180px]"
            >
              <div className="w-16 h-16 bg-[#8E7A6B] flex items-center justify-center text-white font-medium text-xl mx-auto mb-4">
                {m.initials}
              </div>
              <div
                className="font-light text-[#1a1a1a] text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {m.name}
              </div>
              <div className="text-xs text-[#6b6560] mt-1">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#e8e6e3] py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <Package className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("cta.title")}
          </h2>
          <p className="text-[#6b6560] mb-10">{t("cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/post"
              className="inline-flex items-center justify-center gap-2 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
            >
              {t("cta.postAd")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-[#e8e6e3] text-[#666] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#f0eeeb] transition-colors"
            >
              {t("cta.getInTouch")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
