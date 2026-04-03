import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CreditCard,
  Eye,
  Flag,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslator } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Safety Tips — NextBazar",
  description:
    "Stay safe when buying and selling on NextBazar. Essential tips for secure transactions.",
};

function getBuyerTips(t: Awaited<ReturnType<typeof getTranslator>>) {
  return [
    {
      icon: MapPin,
      title: t("meetPublic"),
      desc: t("meetPublicDesc"),
    },
    {
      icon: Eye,
      title: t("inspectBefore"),
      desc: t("inspectBeforeDesc"),
    },
    {
      icon: CreditCard,
      title: t("paySafely"),
      desc: t("paySafelyDesc"),
    },
    {
      icon: UserCheck,
      title: t("checkProfile"),
      desc: t("checkProfileDesc"),
    },
    {
      icon: AlertTriangle,
      title: t("tooGoodToBeTrue"),
      desc: t("tooGoodDesc"),
    },
    {
      icon: MessageCircle,
      title: t("keepOnPlatform"),
      desc: t("keepOnPlatformDesc"),
    },
  ];
}

function getSellerTips(t: Awaited<ReturnType<typeof getTranslator>>) {
  return [
    {
      icon: Lock,
      title: t("neverShare"),
      desc: t("neverShareDesc"),
    },
    {
      icon: Phone,
      title: t("cautious"),
      desc: t("cautiousDesc"),
    },
    {
      icon: Ban,
      title: t("avoidShipping"),
      desc: t("avoidShippingDesc"),
    },
    {
      icon: UserCheck,
      title: t("verifyPayment"),
      desc: t("verifyPaymentDesc"),
    },
  ];
}

function getRedFlags(t: Awaited<ReturnType<typeof getTranslator>>) {
  return [
    t("flagRefuses"),
    t("flagPrice"),
    t("flagGiftCard"),
    t("flagOverpay"),
    t("flagPressure"),
    t("flagGrammar"),
    t("flagOffPlatform"),
    t("flagFakeShipping"),
  ];
}

function getReportSteps(t: Awaited<ReturnType<typeof getTranslator>>) {
  return [
    { step: t("reportStep1"), text: t("reportText1") },
    { step: t("reportStep2"), text: t("reportText2") },
    { step: t("reportStep3"), text: t("reportText3") },
    { step: t("reportStep4"), text: t("reportText4") },
  ];
}

export default async function SafetyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, "safety");
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-5 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("title")}
          </h1>
          <p className="text-lg text-[#6b6560] max-w-xl mx-auto leading-relaxed">
            {t("intro")}
          </p>
        </div>
      </section>

      {/* Buyer tips */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
          {t("buyingSafely")}
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("tipsForBuyers")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          {getBuyerTips(t).map((tip) => (
            <div key={tip.title} className="bg-white p-7 flex gap-5">
              <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                <tip.icon className="w-4 h-4 text-[#8E7A6B]" />
              </div>
              <div>
                <h3
                  className="font-light text-[#1a1a1a] mb-1.5"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {tip.title}
                </h3>
                <p className="text-sm text-[#6b6560] leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seller tips */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
          {t("sellingSafely")}
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("tipsForSellers")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          {getSellerTips(t).map((tip) => (
            <div key={tip.title} className="bg-white p-7 flex gap-5">
              <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                <tip.icon className="w-4 h-4 text-[#8E7A6B]" />
              </div>
              <div>
                <h3
                  className="font-light text-[#1a1a1a] mb-1.5"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {tip.title}
                </h3>
                <p className="text-sm text-[#6b6560] leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Red flags banner */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-white border border-[#e8e6e3] p-8 md:p-10">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-red-400 mb-4">
            {t("beAware")}
          </p>
          <h2
            className="text-xl md:text-2xl font-light text-[#1a1a1a] mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("commonRedFlags")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {getRedFlags(t).map((flag) => (
              <div
                key={flag}
                className="flex items-start gap-3 text-sm text-[#666]"
              >
                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                {flag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to report */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-white border border-[#e8e6e3] p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-[#8E7A6B]" />
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560]">
                {t("reporting")}
              </p>
              <h2
                className="text-xl font-light text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("howToReport")}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {getReportSteps(t).map((s) => (
              <div key={s.step}>
                <div
                  className="text-2xl font-light text-[#8E7A6B] mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {s.step}
                </div>
                <p className="text-sm text-[#666] leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e8e6e3] mt-8 pt-6">
            <p className="text-xs text-[#6b6560]">
              {t("reportEmail")}{" "}
              <a
                href="mailto:trust@nextbazar.com"
                className="text-[#8E7A6B] hover:underline"
              >
                {t("trustEmail")}
              </a>{" "}
              {t("reportUrgent")}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#e8e6e3] py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2
            className="text-2xl font-light text-[#1a1a1a] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("questionsOrConcerns")}
          </h2>
          <p className="text-[#6b6560] mb-10 text-sm">{t("teamHere")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
          >
            Contact Us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
