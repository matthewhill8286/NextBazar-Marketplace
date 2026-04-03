import {
  ArrowRight,
  BarChart2,
  Bell,
  Check,
  CheckCircle,
  Crown,
  Megaphone,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PRO_SELLER_FEATURE_GROUPS } from "@/app/[locale]/dashboard/dealer/pro-seller-features";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import {
  SELLER_PLANS,
  formatEur,
  yearlySavings,
} from "@/lib/pricing-config";
import PromoCodeInput from "./promo-code-input";
import DealersSubscribeButton from "./subscribe-button";
import PlanSelector from "./plan-selector";

export const metadata: Metadata = {
  title: "Seller Plans — NextBazar",
  description:
    "Choose your seller plan on NextBazar. Start free, or go Pro or Business for unlimited listings, analytics, AI tools, and more.",
};

const FEATURES = [
  {
    icon: Package,
    title: "Unlimited listings",
    desc: "List your entire inventory with no cap. Manage everything from one dashboard.",
  },
  {
    icon: Megaphone,
    title: "Free Boosts every month",
    desc: "Promote listings to the top of search results — Pro gets 3/mo, Business gets 10/mo.",
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
    title: "Verified dealer badge",
    desc: "A verified badge on your profile and every listing builds buyer trust. Business plan exclusive.",
  },
  {
    icon: Bell,
    title: "Stock management & alerts",
    desc: "Track inventory levels and get alerts when stock is low. Business plan exclusive.",
  },
  {
    icon: Zap,
    title: "AI listing descriptions",
    desc: "Generate compelling, SEO-optimised descriptions for your listings with one click. Business plan exclusive.",
  },
];

const COMPARISON_ROWS = [
  { label: "Active listings", values: ["10", "Unlimited", "Unlimited"] },
  { label: "Images per listing", values: ["2", "10", "20 + video"] },
  { label: "Free Boosts / month", values: ["—", "3", "10"] },
  { label: "Branded shop page", values: ["Basic", "Full", "Full"] },
  { label: "Analytics", values: ["—", "✓", "Advanced"] },
  { label: "CSV bulk import", values: ["—", "—", "✓"] },
  { label: "Stock management", values: ["—", "—", "✓"] },
  { label: "AI descriptions", values: ["—", "—", "✓"] },
  { label: "Team members", values: ["1", "1", "Up to 5"] },
  { label: "Support", values: ["Community", "Priority", "Dedicated"] },
];

const TESTIMONIALS = [
  {
    name: "Stavros P.",
    role: "Used car seller, Limassol",
    quote:
      "Since upgrading to Pro our enquiries doubled within the first month. The analytics alone are worth it.",
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

const TIER_ICONS = {
  starter: Star,
  pro: Crown,
  business: Sparkles,
};

export default async function DealersPage() {
  if (!FEATURE_FLAGS.DEALERS_PAGE) notFound();

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-28 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <Crown className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-6">
            Seller Plans
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Sell more, grow faster
          </h1>
          <p className="text-lg text-[#6b6560] max-w-2xl mx-auto mb-6 leading-relaxed">
            Start free and upgrade as your business grows. Every paid plan
            includes a 14-day money-back guarantee.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[#8a8280]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              No setup fees
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Secure Stripe payments
            </span>
          </div>
        </div>
      </section>

      {/* Plan cards — client component for billing toggle */}
      <section className="max-w-5xl mx-auto px-6 -mt-10">
        <PlanSelector />
      </section>

      {/* Promo code */}
      <section className="max-w-md mx-auto px-6 py-8 text-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 border-t border-[#e8e6e3]" />
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#8a8280]">
            Have a promo code?
          </span>
          <div className="flex-1 border-t border-[#e8e6e3]" />
        </div>
        <PromoCodeInput />
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
          Built for serious sellers
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

      {/* Comparison table */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] text-center mb-4">
          Compare Plans
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] text-center mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Find the right fit
        </h2>
        <div className="bg-white border border-[#e8e6e3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8e6e3]">
                  <th className="text-left px-6 py-3 text-[#8a8280] font-medium w-1/4">
                    Feature
                  </th>
                  {SELLER_PLANS.map((p) => {
                    const Icon = TIER_ICONS[p.key];
                    return (
                      <th
                        key={p.key}
                        className={`text-center px-4 py-3 font-medium ${
                          p.popular ? "text-[#8E7A6B]" : "text-[#1a1a1a]"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" />
                          {p.name}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-[#e8e6e3] last:border-0"
                  >
                    <td className="px-6 py-3 text-[#444]">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="text-center px-4 py-3 text-[#666]">
                        {v === "✓" ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : v === "—" ? (
                          <span className="text-[#ccc]">—</span>
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          Everything included with Pro
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
            Ready to grow?
          </h2>
          <p className="text-white/50 mb-10">
            Join hundreds of sellers already growing their business on
            NextBazar. Start with Pro or go all-in with Business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <DealersSubscribeButton
              label="Get Pro — €29/mo"
              variant="white"
              tier="pro"
              billing="monthly"
            />
            <DealersSubscribeButton
              label="Get Business — €89/mo"
              variant="white"
              tier="business"
              billing="monthly"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
