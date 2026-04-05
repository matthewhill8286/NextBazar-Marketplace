"use client";

import {
  ArrowRight,
  BarChart2,
  Bell,
  Check,
  CheckCircle,
  Crown,
  MessageCircle,
  Package,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { PRO_SELLER_FEATURE_GROUPS } from "@/app/[locale]/dashboard/dealer/pro-seller-features";
import { Link } from "@/i18n/navigation";
import {
  BOOST_PACKAGES,
  BUYER_PLANS,
  formatEur,
  SELLER_PLANS,
  yearlySavings,
} from "@/lib/pricing-config";
import PlanSelector from "./plan-selector";
import PromoCodeInput from "./promo-code-input";
import DealersSubscribeButton from "./subscribe-button";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "sellers" | "boosts" | "buyers";
type BillingCycle = "monthly" | "yearly";

// ─── Tab config ─────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "sellers", label: "Seller Plans", icon: Package },
  { key: "boosts", label: "Listing Boosts", icon: Rocket },
  { key: "buyers", label: "Buyer+", icon: ShoppingBag },
];

// ─── Seller features for grid ───────────────────────────────────────────────

const SELLER_FEATURES = [
  {
    icon: Package,
    title: "Unlimited listings",
    desc: "List your entire inventory with no cap. Manage everything from one dashboard.",
  },
  {
    icon: Rocket,
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

// ─── Component ──────────────────────────────────────────────────────────────

export default function PricingClient() {
  const [tab, setTab] = useState<Tab>("sellers");
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-28 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <Crown className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-6">
            Pricing
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-[#6b6560] max-w-2xl mx-auto mb-6 leading-relaxed">
            Whether you&apos;re buying, selling, or running a dealership —
            there&apos;s a plan that fits. No hidden fees. Every paid plan
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

      {/* Tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#e8e6e3] shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-1 px-4 py-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0eeeb]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {tab === "sellers" && <SellerSection />}
        {tab === "boosts" && <BoostSection />}
        {tab === "buyers" && (
          <BuyerSection billing={billing} onBillingChange={setBilling} />
        )}
      </div>

      {/* FAQ / trust strip */}
      <section className="bg-white border-t border-[#e8e6e3] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-2xl font-light text-[#1a1a1a] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Questions?
          </h2>
          <p className="text-[#6b6560] mb-6">
            All plans include a 14-day money-back guarantee. Cancel anytime from
            your dashboard.
          </p>
          <div className="flex items-center justify-center gap-8 text-xs text-[#8a8280]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              No lock-in contracts
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Secure Stripe payments
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Cancel in 2 clicks
            </span>
          </div>
          <p className="text-[10px] text-[#aaa] mt-6">
            A 3.5% platform fee applies to completed transactions over €500.
            Seller plan subscribers enjoy reduced rates.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Billing Toggle ─────────────────────────────────────────────────────────

function BillingToggle({
  billing,
  onChange,
}: {
  billing: BillingCycle;
  onChange: (b: BillingCycle) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <button
        onClick={() => onChange("monthly")}
        className={`px-4 py-2 text-sm font-medium transition-all ${
          billing === "monthly"
            ? "bg-[#1a1a1a] text-white"
            : "bg-[#f0eeeb] text-[#6b6560] hover:text-[#1a1a1a]"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("yearly")}
        className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
          billing === "yearly"
            ? "bg-[#1a1a1a] text-white"
            : "bg-[#f0eeeb] text-[#6b6560] hover:text-[#1a1a1a]"
        }`}
      >
        Yearly
        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 font-semibold">
          SAVE UP TO 22%
        </span>
      </button>
    </div>
  );
}

// ─── Seller Plans Section (merged from /pro-sellers) ────────────────────────

function SellerSection() {
  return (
    <div>
      {/* Plan cards with Stripe Checkout integration */}
      <section className="max-w-5xl mx-auto -mt-2">
        <PlanSelector />
      </section>

      {/* Promo code */}
      <section className="max-w-md mx-auto py-8 text-center">
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
      <section className="max-w-5xl mx-auto py-16">
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
          {SELLER_FEATURES.map((f) => (
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
      <section className="max-w-4xl mx-auto pb-16">
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
                    const Icon = TIER_ICONS[p.key as keyof typeof TIER_ICONS];
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
      <section className="max-w-5xl mx-auto pb-16">
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
      <section className="max-w-5xl mx-auto pb-16">
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

// ─── Boost Packages Section ─────────────────────────────────────────────────

function BoostSection() {
  const ICONS: Record<string, React.ElementType> = {
    urgent: Zap,
    featured: Star,
    spotlight: Crown,
    bundle: Sparkles,
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2
          className="text-2xl font-light text-[#1a1a1a] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Listing Boosts
        </h2>
        <p className="text-[#6b6560]">
          Give any listing extra visibility — one-time purchase, no subscription
          needed
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {BOOST_PACKAGES.map((pkg) => {
          const Icon = ICONS[pkg.key] ?? Zap;
          return (
            <div
              key={pkg.key}
              className={`relative bg-white border p-5 flex flex-col ${
                pkg.popular
                  ? "border-[#8E7A6B] shadow-lg shadow-[#8E7A6B]/10"
                  : "border-[#e8e6e3]"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8E7A6B] text-white text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1">
                  Most Popular
                </div>
              )}

              <div className="w-10 h-10 bg-[#f0eeeb] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#8E7A6B]" />
              </div>

              <h3 className="text-base font-semibold text-[#1a1a1a]">
                {pkg.name}
              </h3>
              <p className="text-xs text-[#8a8280] mb-4">{pkg.tagline}</p>

              <div className="mb-4">
                <span className="text-2xl font-bold text-[#1a1a1a]">
                  {formatEur(pkg.amount)}
                </span>
                <span className="text-xs text-[#8a8280] ml-1">
                  / {pkg.durationDays} days
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {pkg.perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-xs text-[#444]"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard/listings"
                className={`block text-center py-2.5 text-sm font-semibold transition-colors ${
                  pkg.popular
                    ? "bg-[#8E7A6B] text-white hover:bg-[#7A6657]"
                    : "bg-[#f0eeeb] text-[#1a1a1a] hover:bg-[#e8e6e3]"
                }`}
              >
                Boost a listing
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-[#8E7A6B]/5 border border-[#8E7A6B]/20 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            Pro & Business sellers get free Boosts every month
          </p>
          <p className="text-xs text-[#6b6560] mt-0.5">
            Upgrade your seller plan and save on promotion costs.
          </p>
        </div>
        <Link
          href="/pricing"
          className="text-sm font-medium text-[#8E7A6B] hover:text-[#7A6657] flex items-center gap-1"
        >
          View seller plans <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Buyer+ Section ─────────────────────────────────────────────────────────

function BuyerSection({
  billing,
  onBillingChange,
}: {
  billing: BillingCycle;
  onBillingChange: (b: BillingCycle) => void;
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 mb-4">
          Coming Soon
        </div>
        <h2
          className="text-2xl font-light text-[#1a1a1a] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Buyer+
        </h2>
        <p className="text-[#6b6560]">
          Premium tools for smarter buying — price alerts, buyer protection, and
          more
        </p>
      </div>

      <BillingToggle billing={billing} onChange={onBillingChange} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BUYER_PLANS.map((plan) => {
          const price =
            billing === "monthly" ? plan.monthlyAmount : plan.yearlyMonthly;
          const savings = yearlySavings(plan.monthlyAmount, plan.yearlyAmount);

          return (
            <div
              key={plan.key}
              className={`relative bg-white border p-6 flex flex-col ${
                plan.popular
                  ? "border-[#8E7A6B] shadow-lg shadow-[#8E7A6B]/10 scale-[1.02]"
                  : "border-[#e8e6e3]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8E7A6B] text-white text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1">
                  Best Value
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  {plan.name}
                </h3>
                <p className="text-sm text-[#8a8280] mt-0.5">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1a1a1a]">
                    {formatEur(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-[#8a8280]">/mo</span>
                  )}
                </div>
                {billing === "yearly" && savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Save {savings}% with yearly billing
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[#444]"
                  >
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="block w-full text-center py-3 text-sm font-semibold bg-[#f0eeeb] text-[#8a8280] cursor-not-allowed"
              >
                {plan.key === "free" ? "Current plan" : "Coming soon"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
