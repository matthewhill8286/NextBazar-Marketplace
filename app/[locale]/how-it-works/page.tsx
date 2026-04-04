import {
  ArrowRight,
  Camera,
  CreditCard,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how to buy and sell on NextBazar in three simple steps. Create your account, post a listing, and connect with buyers across Cyprus.",
  alternates: buildAlternates("/how-it-works"),
};

const BUYER_STEPS = [
  {
    icon: Search,
    title: "Browse & Search",
    description:
      "Explore thousands of listings across vehicles, property, electronics, fashion, and more. Use our AI-powered search to find exactly what you're looking for.",
  },
  {
    icon: MessageCircle,
    title: "Message the Seller",
    description:
      "Found something you like? Send the seller a message directly through NextBazar. Chat in real-time, ask questions, and negotiate — all in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Meet & Complete",
    description:
      "Arrange a safe meeting point, inspect the item, and complete the transaction. Look for verified seller badges for extra peace of mind.",
  },
];

const SELLER_STEPS = [
  {
    icon: Camera,
    title: "Create Your Listing",
    description:
      "Take great photos, write a clear description, set your price, and publish. Your listing goes live in seconds and reaches buyers across Cyprus.",
  },
  {
    icon: Sparkles,
    title: "Get Discovered",
    description:
      "Our AI-powered search and category browsing helps buyers find your items. Boost your listing or go Pro for even more visibility and analytics.",
  },
  {
    icon: Package,
    title: "Close the Deal",
    description:
      "Respond to interested buyers via instant messaging. Arrange the handover and mark your listing as sold. It's that simple.",
  },
];

const PRO_FEATURES = [
  {
    icon: Store,
    title: "Branded Shop Page",
    description:
      "Get your own custom shop with banner, logo, and a shareable URL. Build your brand on NextBazar.",
  },
  {
    icon: CreditCard,
    title: "Flexible Plans",
    description:
      "Start free with up to 5 listings, or go Pro (€29/mo) or Business (€89/mo) for more power.",
  },
  {
    icon: UserPlus,
    title: "Grow Your Business",
    description:
      "Access analytics, priority placement, and unlimited listings to scale your sales in Cyprus.",
  },
];

function StepCard({
  step,
  index,
}: {
  step: { icon: React.ElementType; title: string; description: string };
  index: number;
}) {
  const Icon = step.icon;
  return (
    <div className="relative flex flex-col items-center text-center p-6">
      <div className="w-14 h-14 bg-[#8E7A6B] text-white flex items-center justify-center mb-4 text-lg font-bold">
        {index + 1}
      </div>
      <Icon className="w-6 h-6 text-[#8E7A6B] mb-3" />
      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
        {step.title}
      </h3>
      <p className="text-[#6b6560] text-sm leading-relaxed">
        {step.description}
      </p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4">
          How NextBazar Works
        </h1>
        <p className="text-[#6b6560] text-lg max-w-2xl mx-auto">
          Whether you're looking for a great deal or ready to sell, NextBazar
          makes it simple. Here's how it works in three easy steps.
        </p>
      </div>

      {/* Buyers Section */}
      <section className="mb-20">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-[#f0eeeb] text-[#8E7A6B] text-sm font-semibold mb-3">
            For Buyers
          </span>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            Find What You Need
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {BUYER_STEPS.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors"
          >
            Start Browsing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#e8e6e3] mb-20" />

      {/* Sellers Section */}
      <section className="mb-20">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-[#f0eeeb] text-[#8E7A6B] text-sm font-semibold mb-3">
            For Sellers
          </span>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            Sell Fast, Sell Smart
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {SELLER_STEPS.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/post"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-semibold text-sm hover:bg-[#333] transition-colors"
          >
            Post a Listing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#e8e6e3] mb-20" />

      {/* Pro Sellers Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-[#8E7A6B] text-white text-sm font-semibold mb-3">
            Go Pro
          </span>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            Take Your Selling to the Next Level
          </h2>
          <p className="text-[#6b6560] mt-2 max-w-xl mx-auto">
            Upgrade to a Pro or Business plan for powerful tools designed for
            serious sellers and dealers.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PRO_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-[#faf9f7] border border-[#e8e6e3] p-6 text-center"
              >
                <Icon className="w-8 h-8 text-[#8E7A6B] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#6b6560] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#8E7A6B] text-[#8E7A6B] font-semibold text-sm hover:bg-[#8E7A6B] hover:text-white transition-colors"
          >
            View Plans & Pricing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bg-[#1a1a1a] text-white p-10 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-white/70 mb-6 max-w-lg mx-auto">
          Join thousands of buyers and sellers across Cyprus. Create your free
          account in under a minute.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors"
        >
          Create Free Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
