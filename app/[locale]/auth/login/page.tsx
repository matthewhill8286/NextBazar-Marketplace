import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthIllustration } from "@/app/components/illustrations";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — NextBazar",
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuthIllustration className="w-24 h-24 mx-auto mb-6 text-[#ccc]" />
          <h1
            className="text-3xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome back
          </h1>
          <p className="text-[#999] mt-2 text-sm">
            Sign in to your NextBazar account
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-80 bg-white border border-[#e8e6e3] animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-[#999] mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[#8E7A6B] font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
