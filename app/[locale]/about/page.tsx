import {
  ArrowRight,
  Globe2,
  Heart,
  Package,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — NextBazar",
  description:
    "Learn about NextBazar — the modern marketplace built for Cyprus and beyond.",
};

const STATS = [
  { label: "Active listings", value: "10,000+" },
  { label: "Registered users", value: "25,000+" },
  { label: "Cities covered", value: "12" },
  { label: "Successful deals", value: "50,000+" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    desc: "Every listing is reviewed and our community reporting tools keep the platform clean and safe for everyone.",
  },
  {
    icon: Zap,
    title: "Speed",
    desc: "Post an ad in under 2 minutes. Real-time messaging and instant notifications mean deals happen fast.",
  },
  {
    icon: Heart,
    title: "Community First",
    desc: "We're built for real people, not bots. Verified profiles, honest reviews, and fair pricing tools put the community in control.",
  },
  {
    icon: Globe2,
    title: "Local Focus",
    desc: "Rooted in Cyprus, NextBazar is designed for face-to-face commerce — with smart location filters and WhatsApp/Telegram contact options.",
  },
];

const TEAM = [
  {
    initials: "MH",
    name: "Matt Hill",
    role: "Co-founder & CTO",
  },
  {
    initials: "YD",
    name: "Yaroslava D.",
    role: "Co-founder & Head Designer",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-6">
            Our Story
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The marketplace built
            <br className="hidden md:block" />
            for real people
          </h1>
          <p className="text-lg text-[#999] max-w-2xl mx-auto mb-12 leading-relaxed">
            NextBazar started with a simple belief: buying and selling locally
            should be fast, safe, and actually enjoyable. We built the platform
            we always wished existed.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
          >
            Browse Listings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#e8e6e3]">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white p-8 text-center"
            >
              <div
                className="text-3xl font-light text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {s.value}
              </div>
              <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#999]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-[#2C2826] p-10 md:p-16 text-white">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/40 mb-6">
            Our Mission
          </p>
          <h2
            className="text-2xl md:text-3xl font-light mb-6 leading-[1.2]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Making every transaction seamless
          </h2>
          <p className="text-white/60 leading-relaxed text-lg max-w-2xl">
            To make every transaction in Cyprus — from a second-hand sofa to a
            pre-owned BMW — as seamless, transparent, and trustworthy as
            buying from a friend. No hidden fees, no dark patterns, no noise.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] text-center mb-4">
          What We Stand For
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-12 text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Our values
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#e8e6e3]">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white p-8 flex gap-5"
            >
              <div className="w-11 h-11 bg-[#faf9f7] flex items-center justify-center shrink-0">
                <v.icon className="w-5 h-5 text-[#8E7A6B]" />
              </div>
              <div>
                <h3
                  className="text-lg font-light text-[#1a1a1a] mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {v.title}
                </h3>
                <p className="text-sm text-[#999] leading-relaxed">
                  {v.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] text-center mb-4">
          The People Behind NextBazar
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-12 text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Meet the team
        </h2>
        <div className="flex flex-wrap justify-center gap-px bg-[#e8e6e3] max-w-md mx-auto">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="bg-white p-8 text-center flex-1 min-w-[180px]"
            >
              <div className="w-16 h-16 bg-[#8E7A6B] flex items-center justify-center text-white font-medium text-xl mx-auto mb-4">
                {m.initials}
              </div>
              <div
                className="font-light text-[#1a1a1a] text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {m.name}
              </div>
              <div className="text-xs text-[#999] mt-1">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#e8e6e3] py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <Package className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to start selling?
          </h2>
          <p className="text-[#999] mb-10">
            Post your first ad for free and reach thousands of buyers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/post"
              className="inline-flex items-center justify-center gap-2 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
            >
              Post an Ad
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-[#e8e6e3] text-[#666] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#f0eeeb] transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
