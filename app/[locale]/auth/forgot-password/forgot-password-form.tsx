"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { ErrorBanner } from "@/app/components/ui";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard/settings`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-white border border-[#e8e6e3] p-8 shadow-sm text-center">
        <div className="w-12 h-12 bg-emerald-50 flex items-center justify-center mx-auto mb-4 rounded-full">
          <Mail className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">
          Check your email
        </h2>
        <p className="text-[#6b6560] text-sm mb-6 leading-relaxed">
          We've sent a password reset link to{" "}
          <strong className="text-[#1a1a1a]">{email}</strong>. Click the link in
          the email to set a new password.
        </p>
        <p className="text-[#6b6560] text-xs mb-6">
          Didn't receive it? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-[#8E7A6B] underline hover:text-[#7A6657]"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-[#8E7A6B] text-sm hover:text-[#7A6657] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e8e6e3] p-8 shadow-sm">
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6b6560] mb-2"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5ada6]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 border border-[#e8e6e3] text-sm focus:outline-none focus:border-[#8E7A6B] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#8E7A6B] text-white text-xs uppercase tracking-[0.15em] font-medium hover:bg-[#7A6657] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send reset link
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-[#8E7A6B] text-sm hover:text-[#7A6657] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
