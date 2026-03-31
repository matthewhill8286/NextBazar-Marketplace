import {
  BarChart2,
  Bell,
  CheckCircle,
  Crown,
  Megaphone,
  MessageCircle,
  Package,
  ShieldCheck,
  Tag,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRO_SELLER_FEATURE_GROUPS } from "@/app/[locale]/dashboard/dealer/pro-seller-features";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { getClientPricing } from "@/lib/stripe";
import PromoCodeInput from "./promo-code-input";
import DealersSubscribeButton from "./subscribe-button";

export const metadata: Metadata = {
  title: "Pro Seller — NextBazar",
  description:
    "Grow your business on NextBazar. Powerful tools for professional sellers.",
};

const FEATURES = [
  {
    icon: Package,
    title: "Unlimited listings",
    desc: "List your entire inventory with no cap. Manage everything from one dashboard.",
  },
  {
    icon: Megaphone,
    title: "3 free Quick Boosts / month",
    desc: "Promote listings to the top of search results for maximum visibility — included in your plan.",
  },
  {
    icon: BarChart2,
    title: "Analytics dashboard",
    desc: "Track views, saves, messages, and performance per listing. Know exactly what's working.",
  },
  {
    icon: Tag,
    title: "Branded shop page",
    desc: "Your own custom URL, logo, banner, and accent colour — a professional storefront that builds trust.",
  },
  {
    icon: MessageCircle,
    title: "Quick-reply templates",
    desc: "Pre-written message templates so you can respond to buyers in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Pro Seller badge",
    desc: "A PRO badge on your profile and every listing builds buyer trust and increases click-through rate.",
  },
  {
    icon: Bell,
    title: "Auto-renewal",
    desc: "Expiring listings are automatically renewed so you never miss a sale.",
  },
  {
    icon: Zap,
    title: "Response time badge",
    desc: "Show buyers how quickly you reply — fast responders get more enquiries.",
  },
];

const TESTIMONIALS = [
  {
    name: "Stavros P.",
    role: "Used car seller, Limassol",
    quote:
      "Since upgrading to Pro Seller our enquiries doubled within the first month. The analytics alone are worth it.",
    initials: "SP",
  },
  {
    name: "Maria K.",
    role: "Electronics reseller, Nicosia",
    quote:
      "The branded shop page gives me a professional presence. Buyers trust me more and I close deals faster.",
    initials: "MK",
  },
];

export default async function DealersPage() {
  if (!FEATURE_FLAGS.DEALERS_PAGE) notFound();

  const pricing = await getClientPricing();
  const dealerPrice = pricing.dealer.price;
  const dealerInterval = pricing.dealer.interval;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <Crown className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-6">
            Professional Sellers
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Grow your business
            <br className="hidden md:block" />
            with NextBazar Pro
          </h1>
          <p className="text-lg text-[#6b6560] max-w-2xl mx-auto mb-10 leading-relaxed">
            Everything a professional seller needs — unlimited listings,
            powerful analytics, a branded shop page, and a verified badge that
            builds instant buyer trust. All for just{" "}
            <span
              className="text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {dealerPrice}/{dealerInterval}
            </span>
            .
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <DealersSubscribeButton
              label={`Subscribe — ${dealerPrice}/${dealerInterval}`}
            />
          </div>

          {/* Promo code section */}
          <div className="flex items-center gap-3 my-8 max-w-md mx-auto">
            <div className="flex-1 border-t border-[#e8e6e3]" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#8a8280]">
              or
            </span>
            <div className="flex-1 border-t border-[#e8e6e3]" />
          </div>
          <PromoCodeInput />
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] text-center mb-4">
          What You Get
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] text-center mb-14"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Built for high-volume sellers
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#e8e6e3]">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white p-7">
              <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#8E7A6B]" />
              </div>
              <h3
                className="font-light text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {f.title}
              </h3>
              <p className="text-xs text-[#6b6560] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature groups — detailed breakdown */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] text-center mb-4">
          Full Breakdown
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] text-center mb-14"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Everything included
        </h2>
        <div className="grid sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          {PRO_SELLER_FEATURE_GROUPS.map((group) => (
            <div key={group.heading} className="bg-white p-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-5"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {group.heading}
              </h3>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8E7A6B]" />
                    <span className="text-[#666]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-[#2C2826] text-white p-10 md:p-14 text-center">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/40 mb-4">
            Pro Seller
          </p>
          <div className="flex items-end gap-1 justify-center mb-4">
            <span
              className="text-5xl font-light"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {dealerPrice}
            </span>
            <span className="text-lg text-white/40 pb-1">
              /{dealerInterval}
            </span>
          </div>
          <p className="text-white/50 text-sm mb-10 max-w-md mx-auto">
            Cancel anytime. No setup fees. Start selling like a pro today.
          </p>
          <DealersSubscribeButton label="Subscribe Now" variant="white" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] text-center mb-4">
          What Sellers Say
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] text-center mb-14"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Trusted by local sellers
        </h2>
        <div className="grid md:grid-cols-2 gap-px bg-[#e8e6e3]">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white p-8">
              <p
                className="text-[#666] text-lg leading-relaxed mb-8 font-light italic"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[#8E7A6B] flex items-center justify-center text-white font-medium text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#1a1a1a]">
                    {t.name}
                  </div>
                  <div className="text-xs text-[#6b6560]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#2C2826] py-20">
        <div className="max-w-xl mx-auto px-6 text-center text-white">
          <h2
            className="text-2xl md:text-3xl font-light mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to go pro?
          </h2>
          <p className="text-white/50 mb-10">
            Join hundreds of sellers already growing their business on
            NextBazar.
          </p>
          <DealersSubscribeButton
            label={`Get Pro Seller — ${dealerPrice}/${dealerInterval}`}
            variant="white"
          />
        </div>
      </section>
    </div>
  );
}
