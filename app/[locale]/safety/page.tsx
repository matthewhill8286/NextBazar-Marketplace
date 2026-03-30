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
import Link from "next/link";

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

const RED_FLAGS = [
  "Seller/buyer refuses to meet in person",
  "Price is dramatically below market value",
  "Payment requested via gift card or crypto",
  "Overpayment with request to refund difference",
  "Pressure to complete the deal quickly",
  "Poor grammar and copy-pasted messages",
  "Request to continue chat off-platform immediately",
  "Fake shipping or escrow websites",
];

const REPORT_STEPS = [
  { step: "01", text: "Open the listing or message thread" },
  { step: "02", text: "Tap the flag or 'Report' option" },
  { step: "03", text: "Select a reason and add details" },
  { step: "04", text: "Our team reviews within 24 hours" },
];

export default function SafetyPage() {
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
            Stay safe on NextBazar
          </h1>
          <p className="text-lg text-[#999] max-w-xl mx-auto leading-relaxed">
            The vast majority of transactions on our platform go smoothly. These
            tips will help you spot the rare bad actor and keep every deal
            secure.
          </p>
        </div>
      </section>

      {/* Buyer tips */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-4">
          Buying Safely
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tips for buyers
        </h2>
        <div className="grid sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          {BUYER_TIPS.map((tip) => (
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
                <p className="text-sm text-[#999] leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seller tips */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-4">
          Selling Safely
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tips for sellers
        </h2>
        <div className="grid sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          {SELLER_TIPS.map((tip) => (
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
                <p className="text-sm text-[#999] leading-relaxed">
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
            Be Aware
          </p>
          <h2
            className="text-xl md:text-2xl font-light text-[#1a1a1a] mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Common scam red flags
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {RED_FLAGS.map((flag) => (
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
              <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999]">
                Reporting
              </p>
              <h2
                className="text-xl font-light text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                How to report suspicious activity
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {REPORT_STEPS.map((s) => (
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
            <p className="text-xs text-[#999]">
              You can also email us at{" "}
              <a
                href="mailto:trust@nextbazar.com"
                className="text-[#8E7A6B] hover:underline"
              >
                trust@nextbazar.com
              </a>{" "}
              for urgent safety concerns.
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
            Questions or concerns?
          </h2>
          <p className="text-[#999] mb-10 text-sm">
            Our trust & safety team is here to help.
          </p>
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
