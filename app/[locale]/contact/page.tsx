"use client";

import {
  ArrowRight,
  CheckCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
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
    color: "bg-indigo-50 text-indigo-600",
    title: "Email us",
    detail: "hello@nextbazar.com",
    sub: "We reply within 24 hours",
    href: "mailto:hello@nextbazar.com",
  },
  {
    icon: ShieldCheck,
    color: "bg-amber-50 text-amber-600",
    title: "Trust & Safety",
    detail: "trust@nextbazar.com",
    sub: "Urgent reports prioritised",
    href: "mailto:trust@nextbazar.com",
  },
  {
    icon: MessageCircle,
    color: "bg-emerald-50 text-emerald-600",
    title: "Live chat",
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Get in touch
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            A question, a problem, or just want to say hello — we'd love to hear
            from you. Our team usually responds within one business day.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-14 grid md:grid-cols-5 gap-8">
        {/* Contact cards — left col */}
        <div className="md:col-span-2 space-y-4">
          {CONTACT_CARDS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 transition-colors shadow-sm group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${c.color}`}>
                  <c.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">
                    {c.title}
                  </div>
                  <div className="text-sm text-indigo-600 font-medium truncate group-hover:underline">
                    {c.detail}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
                </div>
              </div>
            </a>
          ))}

          {/* Office */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-0.5">
                  Office
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  NextBazar Ltd<br />
                  Limassol, Cyprus
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form — right col */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Message sent!
                </h2>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Thanks for reaching out. We'll get back to you at{" "}
                  <span className="font-medium text-gray-700">{form.email}</span>{" "}
                  within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Send us a message
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Your name
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Email address
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Topic
                  </label>
                  <select
                    required
                    value={form.topic}
                    onChange={(e) => set("topic", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-700 bg-white"
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Describe your question or issue in as much detail as you can…"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-gray-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message <ArrowRight className="w-4 h-4" />
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
