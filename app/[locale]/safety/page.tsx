import type { Metadata } from "next";
import Link from "next/link";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Safety Tips — NextBazar",
  description:
    "Stay safe when buying and selling on NextBazar. Essential tips for secure transactions.",
};

const BUYER_TIPS = [
  {
    icon: MapPin,
    title: "Meet in a public place",
    desc: "Always arrange to meet in a busy, well-lit public location — a café, shopping centre, or police station parking lot. Never meet at your home or an isolated location.",
  },
  {
    icon: Eye,
    title: "Inspect before you pay",
    desc: "Examine the item in person before handing over any money. Test electronics, check for damage, and verify it matches the listing description.",
  },
  {
    icon: CreditCard,
    title: "Pay safely",
    desc: "Prefer cash for in-person deals. If paying digitally, use a trusted payment service with buyer protection. Never pay via gift cards, wire transfer, or cryptocurrency for marketplace goods.",
  },
  {
    icon: UserCheck,
    title: "Check the seller's profile",
    desc: "Look at the seller's rating, reviews, and how long they've been a member. Verified badges indicate the account has been confirmed.",
  },
  {
    icon: AlertTriangle,
    title: "If it seems too good to be true…",
    desc: "Drastically underpriced items, sellers who can't meet in person, or pressure to pay quickly are all red flags. Trust your instincts.",
  },
  {
    icon: MessageCircle,
    title: "Keep communication on-platform",
    desc: "Use NextBazar's built-in messaging for the initial conversation. Avoid moving to external apps before you've confirmed the deal is legitimate.",
  },
];

const SELLER_TIPS = [
  {
    icon: Lock,
    title: "Never share personal details upfront",
    desc: "Don't share your home address, bank account number, or ID before you've confirmed the buyer is genuine.",
  },
  {
    icon: Phone,
    title: "Be cautious with overpayments",
    desc: "Scammers often send a cheque for more than the asking price and ask you to refund the difference. The original payment will bounce — you'll lose both the item and the money.",
  },
  {
    icon: Ban,
    title: "Avoid buyers who want to ship",
    desc: "For high-value items, prefer local buyers who collect in person. Shipping scams often involve fake payment confirmations.",
  },
  {
    icon: UserCheck,
    title: "Verify payment before handing over",
    desc: "Wait for cash to be counted or for a bank transfer to fully clear in your account before releasing the item.",
  },
];

const REPORT_STEPS = [
  { step: "1", text: "Open the listing or message thread" },
  { step: "2", text: "Tap the flag or 'Report' option" },
  { step: "3", text: "Select a reason and add details" },
  { step: "4", text: "Our team reviews within 24 hours" },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Stay safe on NextBazar
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            The vast majority of transactions on our platform go smoothly. These
            tips will help you spot the rare bad actor and keep every deal
            secure.
          </p>
        </div>
      </section>

      {/* Buyer tips */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tips for buyers</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {BUYER_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm"
            >
              <div className="p-2.5 bg-amber-50 rounded-xl shrink-0 h-fit">
                <tip.icon className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {tip.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seller tips */}
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tips for sellers</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {SELLER_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-sm"
            >
              <div className="p-2.5 bg-emerald-50 rounded-xl shrink-0 h-fit">
                <tip.icon className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {tip.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Red flags banner */}
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-red-800 mb-5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Common scam red flags
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-red-700">
            {[
              "Seller/buyer refuses to meet in person",
              "Price is dramatically below market value",
              "Payment requested via gift card or crypto",
              "Overpayment with request to refund difference",
              "Pressure to complete the deal quickly",
              "Poor grammar and copy-pasted messages",
              "Request to continue chat off-platform immediately",
              "Fake shipping or escrow websites",
            ].map((flag) => (
              <li key={flag} className="flex items-start gap-2">
                <span className="mt-0.5 text-red-400 shrink-0">✕</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How to report */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <Flag className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              How to report suspicious activity
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {REPORT_STEPS.map((s) => (
              <div key={s.step} className="flex-1 flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {s.step}
                </div>
                <p className="text-sm text-gray-600 pt-1">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 pt-4">
            You can also email us at{" "}
            <a
              href="mailto:trust@nextbazar.com"
              className="text-indigo-600 hover:underline"
            >
              trust@nextbazar.com
            </a>{" "}
            for urgent safety concerns.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Questions or concerns?
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Our trust & safety team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Contact us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
