import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslator } from "@/lib/translations";

export default async function WhySection({ locale }: { locale: string }) {
  const t = await getTranslator(locale, "home");

  return (
    <section
      className="relative overflow-hidden bg-[#2C2826] text-white"
      aria-label="Why choose NextBazar"
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/70 mb-4">
            {t("why.badge")}
          </p>
          <h2
            className="text-3xl md:text-5xl font-light"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.rich("why.title", {
              em: (chunks) => <span className="italic">{chunks}</span>,
            })}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {(
            [
              {
                num: "01",
                title: t("why.feature1Title"),
                desc: t("why.feature1Desc"),
              },
              {
                num: "02",
                title: t("why.feature2Title"),
                desc: t("why.feature2Desc"),
              },
              {
                num: "03",
                title: t("why.feature3Title"),
                desc: t("why.feature3Desc"),
              },
            ] as const
          ).map(({ num, title, desc }) => (
            <div key={num}>
              <div className="text-[11px] font-medium tracking-[0.3em] text-white/40 mb-6">
                {num}
              </div>
              <h3
                className="text-xl md:text-2xl font-light text-white mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {title}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/post"
            className="group inline-flex items-center gap-3 bg-white text-[#1a1a1a] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#f0eeeb] transition-colors"
          >
            {t("why.startSelling")}
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/search"
            className="group inline-flex items-center gap-3 border border-white/60 text-white px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
          >
            {t("why.browseListings")}
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
