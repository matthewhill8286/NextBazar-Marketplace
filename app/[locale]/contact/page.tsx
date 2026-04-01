"use client";

import {
  ArrowRight,
  CheckCircle,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  const TOPICS = [
    t("form.topicOptions.general"),
    t("form.topicOptions.listing"),
    t("form.topicOptions.account"),
    t("form.topicOptions.billing"),
    t("form.topicOptions.report"),
    t("form.topicOptions.proSeller"),
    t("form.topicOptions.partnership"),
    t("form.topicOptions.other"),
  ];

  const CONTACT_CARDS = [
    {
      icon: Mail,
      title: t("email.title"),
      detail: t("email.address"),
      sub: t("email.sub"),
      href: `mailto:${t("email.address")}`,
    },
    {
      icon: ShieldCheck,
      title: t("trust.title"),
      detail: t("trust.address"),
      sub: t("trust.sub"),
      href: `mailto:${t("trust.address")}`,
    },
  ];

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
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
            {t("hero.title")}
          </h1>
          <p className="text-[#6b6560] max-w-md mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-8">
        {/* Contact cards — left col */}
        <div className="md:col-span-2 space-y-px">
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
                  {t("office.title")}
                </div>
                <div className="text-sm text-[#666] leading-relaxed">
                  {t("office.company")}
                  <br />
                  {t("office.location")}
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
                  {t("success.title")}
                </h2>
                <p className="text-[#6b6560] text-sm max-w-xs mx-auto">
                  {t("success.message", { email: form.email })}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-2">
                    {t("form.label")}
                  </p>
                  <h2
                    className="text-xl font-light text-[#1a1a1a]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {t("form.heading")}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                      {t("form.nameLabel")}
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder={t("form.namePlaceholder")}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                      {t("form.emailLabel")}
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder={t("form.emailPlaceholder")}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                    {t("form.topicLabel")}
                  </label>
                  <select
                    required
                    value={form.topic}
                    onChange={(e) => set("topic", e.target.value)}
                    className={`${INPUT_CLS} text-[#666]`}
                  >
                    <option value="">{t("form.topicPlaceholder")}</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                    {t("form.messageLabel")}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder={t("form.messagePlaceholder")}
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
                      {t("form.submitting")}
                    </>
                  ) : (
                    <>
                      {t("form.submit")} <ArrowRight className="w-4 h-4" />
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
