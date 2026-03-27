import {
  BarChart2,
  Bell,
  CheckCircle,
  Megaphone,
  MessageCircle,
  Package,
  ShieldCheck,
  Star,
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
    color: "bg-indigo-50 text-indigo-600",
    title: "Unlimited listings",
    desc: "List your entire inventory with no cap. Manage everything from one dashboard.",
  },
  {
    icon: Megaphone,
    color: "bg-amber-50 text-amber-600",
    title: "3 free Quick Boosts / month",
    desc: "Promote listings to the top of search results for maximum visibility — included in your plan.",
  },
  {
    icon: BarChart2,
    color: "bg-emerald-50 text-emerald-600",
    title: "Analytics dashboard",
    desc: "Track views, saves, messages, and performance per listing. Know exactly what's working.",
  },
  {
    icon: Tag,
    color: "bg-violet-50 text-violet-600",
    title: "Branded shop page",
    desc: "Your own custom URL, logo, banner, and accent colour — a professional storefront that builds trust.",
  },
  {
    icon: MessageCircle,
    color: "bg-rose-50 text-rose-600",
    title: "Quick-reply templates",
    desc: "Pre-written message templates so you can respond to buyers in seconds.",
  },
  {
    icon: ShieldCheck,
    color: "bg-cyan-50 text-cyan-600",
    title: "Verified Pro Seller badge",
    desc: "A PRO badge on your profile and every listing builds buyer trust and increases click-through rate.",
  },
  {
    icon: Bell,
    color: "bg-orange-50 text-orange-600",
    title: "Auto-renewal",
    desc: "Expiring listings are automatically renewed so you never miss a sale.",
  },
  {
    icon: Zap,
    color: "bg-yellow-50 text-yellow-600",
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
    color: "from-indigo-400 to-indigo-600",
  },
  {
    name: "Maria K.",
    role: "Electronics reseller, Nicosia",
    quote:
      "The branded shop page gives me a professional presence. Buyers trust me more and I close deals faster.",
    initials: "MK",
    color: "from-violet-400 to-violet-600",
  },
];

export default async function DealersPage() {
  if (!FEATURE_FLAGS.DEALERS_PAGE) notFound();

  const pricing = await getClientPricing();
  const dealerPrice = pricing.dealer.price;
  const dealerInterval = pricing.dealer.interval;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-violet-500" /> Professional
            sellers
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
            Grow your business <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">
              with NextBazar Pro
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Everything a professional seller needs — unlimited listings,
            powerful analytics, a branded shop page, and a verified badge that
            builds instant buyer trust. All for just{" "}
            <strong className="text-gray-700">
              {dealerPrice}/{dealerInterval}
            </strong>
            .
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <DealersSubscribeButton
              label={`Subscribe — ${dealerPrice}/${dealerInterval}`}
            />
          </div>

          {/* Promo code section */}
          <div className="flex items-center gap-3 my-6 max-w-md mx-auto">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-gray-400 text-xs font-medium">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          <PromoCodeInput />
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Built for high-volume sellers
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <div className={`p-2.5 rounded-xl w-fit mb-3 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">
                {f.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature groups — detailed breakdown */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Everything included
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {PRO_SELLER_FEATURE_GROUPS.map((group) => (
            <div
              key={group.heading}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
              <h3 className="font-bold text-gray-900 mb-3">{group.heading}</h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-indigo-600 text-white rounded-2xl p-8 md:p-10 shadow-xl shadow-indigo-200 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-2">
            Pro Seller
          </div>
          <div className="flex items-end gap-1 justify-center mb-4">
            <span className="text-5xl font-black">{dealerPrice}</span>
            <span className="text-lg text-indigo-200 pb-1">
              /{dealerInterval}
            </span>
          </div>
          <p className="text-indigo-100 text-sm mb-8 max-w-md mx-auto">
            Cancel anytime. No setup fees. Start selling like a pro today.
          </p>
          <DealersSubscribeButton label="Subscribe Now" variant="white" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Trusted by local sellers
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-600 py-16">
        <div className="max-w-xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to go pro?</h2>
          <p className="text-indigo-100 mb-7">
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
