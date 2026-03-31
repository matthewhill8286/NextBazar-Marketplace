"use client";

import {
  ArrowRight,
  CheckCircle,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const TOPICS = [
  "General enquiry",
  "Listing issue",
  "Account / login problem",
  "Billing or payments",
  "Report a user or listing",
  "Pro Seller / business account",
  "Partnership",
  "Other",
];

const CONTACT_CARDS = [
  {
    icon: Mail,
    title: "Email Us",
    detail: "hello@nextbazar.com",
    sub: "We reply within 24 hours",
    href: "mailto:hello@nextbazar.com",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    detail: "trust@nextbazar.com",
    sub: "Urgent reports prioritised",
    href: "mailto:trust@nextbazar.com",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    detail: "Available Mon–Fri",
    sub: "9:00 – 18:00 EET",
    href: "#chat",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate send
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  const INPUT_CLS =
    "w-full border border-[#e8e6e3] px-4 py-3 text-sm focus:outline-none focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 placeholder-[#9a9290] bg-white transition-colors";

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-6 h-6 text-[#8E7A6B]" />
          </div>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-5 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Get in touch
          </h1>
          <p className="text-[#6b6560] max-w-md mx-auto leading-relaxed">
            A question, a problem, or just want to say hello — we'd love to hear
            from you. Our team usually responds within one business day.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-8">
        {/* Contact cards — left col */}
        <div className="md:col-span-2 space-y-px bg-[#e8e6e3]">
          {CONTACT_CARDS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="block bg-white p-6 hover:bg-[#faf9f7] transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#faf9f7] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                  <c.icon className="w-4 h-4 text-[#8E7A6B]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6b6560] mb-1">
                    {c.title}
                  </div>
                  <div className="text-sm text-[#1a1a1a] font-medium truncate group-hover:text-[#8E7A6B] transition-colors">
                    {c.detail}
                  </div>
                  <div className="text-xs text-[#8a8280] mt-0.5">{c.sub}</div>
                </div>
              </div>
            </a>
          ))}

          {/* Office */}
          <div className="bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#8E7A6B]" />
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6b6560] mb-1">
                  Office
                </div>
                <div className="text-sm text-[#666] leading-relaxed">
                  NextBazar Ltd
                  <br />
                  Limassol, Cyprus
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form — right col */}
        <div className="md:col-span-3">
          <div className="bg-white border border-[#e8e6e3] p-8">
            {submitted ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-[#faf9f7] flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <h2
                  className="text-xl font-light text-[#1a1a1a] mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Message sent
                </h2>
                <p className="text-[#6b6560] text-sm max-w-xs mx-auto">
                  Thanks for reaching out. We'll get back to you at{" "}
                  <span className="font-medium text-[#666]">{form.email}</span>{" "}
                  within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-2">
                    Contact Form
                  </p>
                  <h2
                    className="text-xl font-light text-[#1a1a1a]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Send us a message
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                      Your name
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Jane Doe"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                      Email address
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="jane@example.com"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                    Topic
                  </label>
                  <select
                    required
                    value={form.topic}
                    onChange={(e) => set("topic", e.target.value)}
                    className={`${INPUT_CLS} text-[#666]`}
                  >
                    <option value="">Select a topic…</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Describe your question or issue in as much detail as you can…"
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase py-3.5 hover:bg-[#7A6657] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Message <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
