import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Heart,
  Package,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";

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
    color: "bg-indigo-50 text-indigo-600",
    title: "Trust & Safety",
    desc: "Every listing is reviewed and our community reporting tools keep the platform clean and safe for everyone.",
  },
  {
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
    title: "Speed",
    desc: "Post an ad in under 2 minutes. Real-time messaging and instant notifications mean deals happen fast.",
  },
  {
    icon: Heart,
    color: "bg-rose-50 text-rose-600",
    title: "Community first",
    desc: "We're built for real people, not bots. Verified profiles, honest reviews, and fair pricing tools put the community in control.",
  },
  {
    icon: Globe2,
    color: "bg-emerald-50 text-emerald-600",
    title: "Local focus",
    desc: "Rooted in Cyprus, NextBazar is designed for face-to-face commerce — with smart location filters and WhatsApp/Telegram contact options.",
  },
];

const TEAM = [
  {
    initials: "MH",
    name: "Matt Hill",
    role: "Co-founder & CTO",
    color: "from-indigo-400 to-indigo-600",
  },
  {
    initials: "YD",
    name: "Yaroslava D.",
    role: "Co-founder & Head Designer",
    color: "from-violet-400 to-violet-600",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5" /> Our story
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
            The marketplace built <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              for real people
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            NextBazar started with a simple belief: buying and selling locally
            should be fast, safe, and actually enjoyable. We built the platform
            we always wished existed.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            Browse listings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm"
            >
              <div className="text-3xl font-black text-gray-900 mb-1">
                {s.value}
              </div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-10 md:p-14 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our mission</h2>
            <p className="text-indigo-100 leading-relaxed text-lg">
              To make every transaction in Cyprus — from a second-hand sofa to a
              pre-owned BMW — as seamless, transparent, and trustworthy as
              buying from a friend. No hidden fees, no dark patterns, no noise.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          What we stand for
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-4 shadow-sm"
            >
              <div className={`p-3 rounded-xl shrink-0 h-fit ${v.color}`}>
                <v.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Meet the team
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="bg-white rounded-2xl border border-gray-100 p-6 text-center w-44 shadow-sm"
            >
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white font-bold text-xl mx-auto mb-3`}
              >
                {m.initials}
              </div>
              <div className="font-semibold text-gray-900 text-sm">
                {m.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Package className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to start selling?
          </h2>
          <p className="text-gray-500 mb-6">
            Post your first ad for free and reach thousands of buyers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/post"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Post an Ad
            </Link>
            <Link
              href="/contact"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
