import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { escapeHtml, escapeHtmlMultiline } from "@/lib/escape-html";
import { ipKey, limit, tooManyRequests } from "@/lib/rate-limit";

// RFC 5322-ish email shape. Deliberately strict: at least one char before
// the @, a dot-segment domain, and a 2+ char TLD. Not meant to validate
// deliverability — just to reject obvious garbage and header-injection
// attempts.
const EMAIL_RX = /^[^\s<>"@;,]+@[^\s<>"@;,]+\.[^\s<>"@;,]{2,}$/;

// Whitelist of topics we advertise in the contact form UI. Anything else
// would be user-controlled input flowing into an email subject line.
const ALLOWED_TOPICS = new Set([
  "general",
  "support",
  "billing",
  "bug",
  "feature",
  "partnership",
  "press",
  "legal",
  "other",
]);

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit by IP: 5 submissions per 10 minutes per source IP.
    // This is a defence against email-bombing via the confirmation mail
    // and against trivial contact-form spam.
    const ip = ipKey(req);
    const rl = await limit(`contact:${ip}`, { max: 5, windowMs: 10 * 60_000 });
    if (!rl.success) return tooManyRequests(rl);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { name, email, topic, message } = body as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof topic !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedTopic = topic.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedTopic || !trimmedMessage) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }

    if (!EMAIL_RX.test(trimmedEmail) || trimmedEmail.length > 320) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TOPICS.has(trimmedTopic.toLowerCase())) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: "Message too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    // All user input is escaped before interpolation into the email HTML
    // body. This prevents HTML/script injection that would otherwise render
    // inside mail clients (some of which execute inline styles/handlers).
    const safeName = escapeHtml(trimmedName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safeTopic = escapeHtml(trimmedTopic);
    const safeMessage = escapeHtmlMultiline(trimmedMessage);

    // Send notification email to the team
    const supportEmail =
      process.env.CONTACT_FORM_EMAIL || "support@nextbazar.com";

    await sendEmail.custom({
      to: supportEmail,
      // Subject is a header — plain-text only, stripped of CR/LF to prevent
      // header injection.
      subject: `[Contact Form] ${trimmedTopic.replace(/[\r\n]/g, " ")} — from ${trimmedName.replace(/[\r\n]/g, " ")}`,
      heading: "New contact form submission",
      body: `
        <strong>From:</strong> ${safeName} (${safeEmail})<br/>
        <strong>Topic:</strong> ${safeTopic}<br/><br/>
        <strong>Message:</strong><br/>
        ${safeMessage}
      `,
    });

    // Send confirmation to the user. This is the email-bombing vector: the
    // `to` address is attacker-controlled, so we MUST rate-limit the caller
    // (done above via `limit`) and cap the send volume per window.
    const firstName = trimmedName.split(/\s+/)[0];
    await sendEmail.custom({
      to: trimmedEmail,
      subject: "We received your message — NextBazar",
      heading: `Thanks for reaching out, ${escapeHtml(firstName)}!`,
      body:
        "We've received your message and will get back to you within 24 hours. " +
        "If your inquiry is urgent, you can also email us directly at support@nextbazar.com.",
      ctaText: "Back to NextBazar",
      ctaUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[contact] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
