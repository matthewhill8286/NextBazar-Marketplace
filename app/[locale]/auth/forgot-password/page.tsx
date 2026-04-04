import type { Metadata } from "next";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password — NextBazar",
  description: "Reset your NextBazar account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-['Playfair_Display',serif] text-2xl text-[#1a1a1a] text-center mb-2">
          Reset your password
        </h1>
        <p className="text-[#6b6560] text-sm text-center mb-8">
          Enter the email address you signed up with and we'll send you a link
          to reset your password.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
