import type { Metadata } from "next";
import Link from "next/link";
import { AuthIllustration } from "@/app/components/illustrations";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Sign Up — NextBazar",
};

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuthIllustration className="w-24 h-24 mx-auto mb-6 text-[#ccc]" />
          <h1
            className="text-3xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Create your account
          </h1>
          <p className="text-[#999] mt-2 text-sm">
            Join NextBazar and start buying &amp; selling
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-[#999] mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[#8E7A6B] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
