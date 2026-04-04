import type { Metadata } from "next";
import { AuthIllustration } from "@/app/components/illustrations";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";
import { getTranslator } from "@/lib/translations";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free NextBazar account. Buy, sell, and connect with trusted sellers across Cyprus.",
  alternates: buildAlternates("/auth/signup"),
};

export default async function SignupPage({
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
            {t("signupTitle")}
          </h1>
          <p className="text-[#6b6560] mt-2 text-sm">
            {t("signupSubtitleAlt")}
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-[#6b6560] mt-6">
          {t("haveAccount")}{" "}
          <Link
            href="/auth/login"
            className="text-[#8E7A6B] font-medium hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
