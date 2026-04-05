import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/app/components/json-ld";
import { Link } from "@/i18n/navigation";
import { buildAlternates, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about buying and selling on NextBazar — Cyprus's AI-powered marketplace.",
  alternates: buildAlternates("/faq"),
};

const FAQS = [
  {
    category: "Buying",
    items: [
      {
        question: "Is it free to buy on NextBazar?",
        answer:
          "Yes, browsing and buying on NextBazar is completely free. There are no buyer fees — you only pay the price agreed with the seller.",
      },
      {
        question: "How do I contact a seller?",
        answer:
          'Click the "Message Seller" button on any listing to start a real-time conversation. You\'ll need a free NextBazar account to send messages.',
      },
      {
        question: "How do I know a seller is trustworthy?",
        answer:
          "Look for the verified badge on seller profiles. Pro and Business sellers have additional verification and are committed to the platform. You can also check seller ratings and how long they've been active.",
      },
      {
        question: "Can I save listings to view later?",
        answer:
          "Yes! Click the heart icon on any listing to save it to your favourites. You can view all saved listings from your dashboard.",
      },
      {
        question: "What areas does NextBazar cover?",
        answer:
          "NextBazar is currently focused on Cyprus, covering all major cities including Nicosia, Limassol, Larnaca, Paphos, and Famagusta. We plan to expand to other Mediterranean markets in the future.",
      },
    ],
  },
  {
    category: "Selling",
    items: [
      {
        question: "How do I list an item for sale?",
        answer:
          'Click "Post Listing" in the navigation bar, fill in the details (title, description, photos, price, category), and publish. Your listing will be live within seconds.',
      },
      {
        question: "What are the seller plans?",
        answer:
          "We offer three tiers: Starter (free, up to 5 active listings), Pro (€29/month, up to 50 listings with analytics and priority support), and Business (€89/month, unlimited listings with a custom branded shop page). All paid plans include monthly and yearly billing options.",
      },
      {
        question: "Can I boost my listing for more visibility?",
        answer:
          "Yes! You can promote your listing to appear at the top of search results, or mark it as urgent for time-sensitive sales. Boost packages are available from your listing management page.",
      },
      {
        question: "How do I open a dealer shop?",
        answer:
          "Subscribe to a Pro or Business plan and complete the onboarding wizard. You'll get a dedicated shop page with your own branding, banner, and URL that you can share with customers.",
      },
    ],
  },
  {
    category: "Account & Safety",
    items: [
      {
        question: "How do I create an account?",
        answer:
          'Click "Sign Up" and register with your email address. You can also sign in with Google for a faster setup. Verification email will be sent to confirm your account.',
      },
      {
        question: "I forgot my password. What do I do?",
        answer:
          'Go to the login page and click "Forgot password?" to receive a password reset link via email. The link is valid for 24 hours.',
      },
      {
        question: "How do I report a suspicious listing?",
        answer:
          "Click the flag icon on any listing to report it. Our moderation team reviews all reports within 24 hours. You can also contact us directly through the contact page.",
      },
      {
        question: "Is my personal information safe?",
        answer:
          "Yes. We use industry-standard encryption and never share your personal details with other users. Your email and phone number are only visible if you choose to display them. Read our Privacy Policy for full details.",
      },
    ],
  },
  {
    category: "Payments & Subscriptions",
    items: [
      {
        question: "What payment methods do you accept for subscriptions?",
        answer:
          "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment partner, Stripe. All transactions are encrypted and PCI-compliant.",
      },
      {
        question: "Can I cancel my subscription at any time?",
        answer:
          "Yes, you can cancel anytime from your dashboard. Your plan benefits will remain active until the end of your current billing period. After that, you'll be moved to the free Starter plan.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "Subscription fees are non-refundable, but you won't be charged again after cancellation. If you experience any issues, please contact our support team and we'll work with you to find a solution.",
      },
    ],
  },
];

// Flatten for JSON-LD
const allFaqs = FAQS.flatMap((cat) => cat.items);

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(allFaqs)} />

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-[#6b6560] text-lg max-w-2xl mx-auto">
            Everything you need to know about buying and selling on NextBazar.
            Can't find what you're looking for?{" "}
            <Link
              href="/contact"
              className="text-[#8E7A6B] hover:text-[#7A6657] underline underline-offset-2"
            >
              Contact us
            </Link>
            .
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-10">
          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4 pb-2 border-b border-[#e8e6e3]">
                {section.category}
              </h2>
              <div className="space-y-0 divide-y divide-[#e8e6e3]">
                {section.items.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="flex items-center justify-between cursor-pointer list-none text-[#1a1a1a] font-medium hover:text-[#8E7A6B] transition-colors">
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown className="w-5 h-5 text-[#8a8280] shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-[#6b6560] leading-relaxed text-sm">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-[#f5f3f0] p-8">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
            Still have questions?
          </h3>
          <p className="text-[#6b6560] text-sm mb-4">
            Our team is here to help. Reach out and we'll get back to you as
            soon as possible.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </>
  );
}
