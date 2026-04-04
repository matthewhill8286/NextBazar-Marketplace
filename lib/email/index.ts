/**
 * Transactional email service powered by Resend.
 *
 * Usage:
 *   import { sendEmail } from "@/lib/email";
 *   await sendEmail.welcome({ to: "user@example.com", name: "Matt" });
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS || "NextBazar <noreply@nextbazar.com>";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";

// ─── Shared layout wrapper ─────────────────────────────────────────────────

function layout(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NextBazar</title>
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e6e3;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid #8E7A6B;">
              <a href="${BASE_URL}" style="text-decoration:none;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">
                NextBazar
              </a>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e8e6e3;background:#faf9f7;">
              <p style="margin:0;font-size:12px;color:#8a8280;line-height:1.5;">
                NextBazar — Cyprus's AI-powered marketplace<br/>
                <a href="${BASE_URL}/en/privacy" style="color:#8E7A6B;">Privacy</a> &middot;
                <a href="${BASE_URL}/en/terms" style="color:#8E7A6B;">Terms</a> &middot;
                <a href="${BASE_URL}" style="color:#8E7A6B;">nextbazar.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#8E7A6B;padding:12px 28px;">
          <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

// ─── Email types ────────────────────────────────────────────────────────────

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Email templates ────────────────────────────────────────────────────────

export const sendEmail = {
  /** Welcome email after signup */
  async welcome({ to, name }: { to: string; name: string }) {
    const firstName = name.split(" ")[0] || "there";
    return send(
      to,
      "Welcome to NextBazar!",
      layout(`
        <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Welcome to NextBazar, ${firstName}!</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Thanks for joining Cyprus's smartest marketplace. You can now browse listings,
          save your favourites, and message sellers directly.
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Ready to sell? Post your first listing in under a minute — it's completely free for up to 5 items.
        </p>
        ${button("Start Exploring", `${BASE_URL}/en/search`)}
        <p style="margin:0;font-size:13px;color:#8a8280;">
          Need help? Check out our <a href="${BASE_URL}/en/faq" style="color:#8E7A6B;">FAQ</a> or
          <a href="${BASE_URL}/en/how-it-works" style="color:#8E7A6B;">How It Works</a> guide.
        </p>
      `),
    );
  },

  /** New message notification */
  async newMessage({
    to,
    senderName,
    listingTitle,
    messagePreview,
    conversationUrl,
  }: {
    to: string;
    senderName: string;
    listingTitle: string;
    messagePreview: string;
    conversationUrl: string;
  }) {
    return send(
      to,
      `New message from ${senderName} about "${listingTitle}"`,
      layout(`
        <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">You have a new message</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          <strong>${senderName}</strong> sent you a message about
          <strong>${listingTitle}</strong>:
        </p>
        <div style="background:#faf9f7;border-left:3px solid #8E7A6B;padding:12px 16px;margin:16px 0;">
          <p style="margin:0;font-size:14px;color:#4a4a4a;line-height:1.5;font-style:italic;">
            "${messagePreview.slice(0, 200)}${messagePreview.length > 200 ? "..." : ""}"
          </p>
        </div>
        ${button("Reply Now", conversationUrl)}
      `),
    );
  },

  /** Listing published confirmation */
  async listingPublished({
    to,
    listingTitle,
    listingUrl,
  }: {
    to: string;
    listingTitle: string;
    listingUrl: string;
  }) {
    return send(
      to,
      `Your listing "${listingTitle}" is live!`,
      layout(`
        <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Your listing is live!</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Great news — <strong>${listingTitle}</strong> is now visible to buyers across Cyprus.
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Want more visibility? You can boost your listing or upgrade to a Pro plan for premium placement.
        </p>
        ${button("View Your Listing", listingUrl)}
      `),
    );
  },

  /** Subscription activated */
  async subscriptionActivated({
    to,
    planName,
    name,
  }: {
    to: string;
    planName: string;
    name: string;
  }) {
    const firstName = name.split(" ")[0] || "there";
    return send(
      to,
      `Welcome to NextBazar ${planName}!`,
      layout(`
        <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">You're now on ${planName}, ${firstName}!</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Your ${planName} subscription is active. You now have access to all the premium features
          that come with your plan.
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Head to your dashboard to set up your shop, customise your branding, and start listing.
        </p>
        ${button("Go to Dashboard", `${BASE_URL}/en/dashboard`)}
      `),
    );
  },

  /** Subscription cancelled */
  async subscriptionCancelled({
    to,
    name,
    expiresAt,
  }: {
    to: string;
    name: string;
    expiresAt: string;
  }) {
    const firstName = name.split(" ")[0] || "there";
    return send(
      to,
      "Your NextBazar subscription has been cancelled",
      layout(`
        <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Subscription cancelled</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          Hi ${firstName}, your paid plan has been cancelled. Your premium features will remain
          active until <strong>${expiresAt}</strong>.
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          After that, you'll be moved to our free Starter plan (up to 5 listings).
          You can re-subscribe anytime to regain access.
        </p>
        ${button("Resubscribe", `${BASE_URL}/en/pricing`)}
        <p style="margin:0;font-size:13px;color:#8a8280;">
          If you have feedback on why you cancelled, we'd love to hear it —
          just reply to this email.
        </p>
      `),
    );
  },

  /** Generic transactional email */
  async custom({
    to,
    subject,
    heading,
    body,
    ctaText,
    ctaUrl,
  }: {
    to: string;
    subject: string;
    heading: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
  }) {
    return send(
      to,
      subject,
      layout(`
        <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">${heading}</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#4a4a4a;line-height:1.6;">
          ${body}
        </p>
        ${ctaText && ctaUrl ? button(ctaText, ctaUrl) : ""}
      `),
    );
  },
};
