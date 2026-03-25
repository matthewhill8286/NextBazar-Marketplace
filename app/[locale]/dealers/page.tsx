import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import {
  ArrowRight,
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

export const metadata: Metadata = {
  title: "For Pro Sellers — NextBazar",
  description:
    "Grow your business on NextBazar. Powerful tools for professional sellers.",
};

const FEATURES = [
  {
    icon: Package,
    color: "bg-indigo-50 text-indigo-600",
    title: "Unlimited listings",
    desc: "List your entire inventory with no cap. Bulk management tools let you update dozens of listings at once.",
  },
  {
    icon: Megaphone,
    color: "bg-amber-50 text-amber-600",
    title: "Featured promotions",
    desc: "Promote individual listings to the top of search results and the homepage for maximum visibility.",
  },
  {
    icon: BarChart2,
    color: "bg-emerald-50 text-emerald-600",
    title: "Advanced analytics",
    desc: "Track views, saves, messages, and conversion rate per listing. Understand exactly what's driving sales.",
  },
  {
    icon: Tag,
    color: "bg-violet-50 text-violet-600",
    title: "Offer management",
    desc: "Receive, counter, accept, or decline offers in one place. Built-in negotiation tools keep everything organised.",
  },
  {
    icon: MessageCircle,
    color: "bg-rose-50 text-rose-600",
    title: "Unified inbox",
    desc: "All buyer messages across all listings in one inbox. Quick-reply templates save you time.",
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
    title: "Real-time notifications",
    desc: "Instant alerts for new messages, offers, and listing activity so you never miss a lead.",
  },
  {
    icon: Zap,
    color: "bg-yellow-50 text-yellow-600",
    title: "Priority support",
    desc: "Pro Seller accounts get access to a dedicated support channel with faster response times.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    highlight: false,
    features: [
      "Up to 10 active listings",
      "Basic analytics",
      "Standard messaging",
      "Community support",
    ],
    cta: "Get started",
    href: "/auth/signup",
  },
  {
    name: "Pro Seller",
    price: "€29",
    period: "/ month",
    highlight: true,
    features: [
      "Unlimited listings",
      "Advanced analytics dashboard",
      "Verified Pro Seller badge",
      "Bulk listing management",
      "Priority support",
      "5 promoted listings / month",
    ],
    cta: "Start free trial",
    href: "/contact",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    highlight: false,
    features: [
      "Everything in Pro Seller",
      "Dedicated account manager",
      "API access",
      "Custom branding options",
      "Volume pricing",
    ],
    cta: "Contact sales",
    href: "/contact",
  },
];

const TESTIMONIALS = [
  {
    name: "Stavros P.",
    role: "Used car seller, Limassol",
    quote:
      "Since upgrading to a Pro Seller account our enquiries doubled within the first month. The analytics alone are worth it.",
    initials: "SP",
    color: "from-indigo-400 to-indigo-600",
  },
  {
    name: "Maria K.",
    role: "Electronics reseller, Nicosia",
    quote:
      "Bulk listing saves me hours every week. The offer management feature means I never lose track of a negotiation.",
    initials: "MK",
    color: "from-violet-400 to-violet-600",
  },
];

export default function DealersPage() {
  if (!FEATURE_FLAGS.DEALERS_PAGE) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-violet-500" /> Professional sellers
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
            Grow your business <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">
              with NextBazar Pro
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Everything a professional seller needs — unlimited listings, powerful
            analytics, offer management, and a verified badge that builds instant
            buyer trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              Get Pro Seller access <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Start for free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
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

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Simple, transparent pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col ${
                plan.highlight
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                  : "bg-white border border-gray-100 shadow-sm"
              }`}
            >
              <div className="mb-6">
                <div
                  className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    plan.highlight ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-4xl font-black ${
                      plan.highlight ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm pb-1 ${
                        plan.highlight ? "text-indigo-200" : "text-gray-400"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.highlight ? "text-indigo-200" : "text-emerald-500"
                      }`}
                    />
                    <span
                      className={
                        plan.highlight ? "text-indigo-100" : "text-gray-600"
                      }
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-colors ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
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
                "{t.quote}"
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

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-600 py-16">
        <div className="max-w-xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to go pro?</h2>
          <p className="text-indigo-100 mb-7">
            Join hundreds of sellers already growing their business on NextBazar.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Get Pro Seller access <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
