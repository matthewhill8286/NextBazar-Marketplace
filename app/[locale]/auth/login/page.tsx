import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthIllustration } from "@/app/components/illustrations";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";
import { getTranslator } from "@/lib/translations";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to your NextBazar account to buy, sell, and message sellers across Cyprus.",
  alternates: buildAlternates("/auth/login"),
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, "auth");

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuthIllustration className="w-24 h-24 mx-auto mb-6 text-[#8a8280]" />
          <h1
            className="text-3xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("welcomeBack")}
          </h1>
          <p className="text-[#6b6560] mt-2 text-sm">{t("loginSubtitle")}</p>
        </div>

        <Suspense
          fallback={
            <div className="h-80 bg-white border border-[#e8e6e3] animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-[#6b6560] mt-6">
          {t("noAccount")}{" "}
          <Link
            href="/auth/signup"
            className="text-[#8E7A6B] font-medium hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
