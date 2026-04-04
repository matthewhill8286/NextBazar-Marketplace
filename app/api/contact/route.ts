import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, topic, message } = body;

    // Basic validation
    if (!name || !email || !topic || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Rate limit by checking message length
    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    // Send notification email to the team
    const supportEmail =
      process.env.CONTACT_FORM_EMAIL || "support@nextbazar.com";

    await sendEmail.custom({
      to: supportEmail,
      subject: `[Contact Form] ${topic} — from ${name}`,
      heading: `New contact form submission`,
      body: `
        <strong>From:</strong> ${name} (${email})<br/>
        <strong>Topic:</strong> ${topic}<br/><br/>
        <strong>Message:</strong><br/>
        ${message.replace(/\n/g, "<br/>")}
      `,
    });

    // Send confirmation to the user
    await sendEmail.custom({
      to: email,
      subject: "We received your message — NextBazar",
      heading: `Thanks for reaching out, ${name.split(" ")[0]}!`,
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
