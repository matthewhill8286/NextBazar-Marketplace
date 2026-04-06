import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// DELETE /api/notifications/delete
// Body: { id: string }
// Deletes a single notification belonging to the authenticated user.
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { userId } = auth;

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing notification id" },
        { status: 400 },
      );
    }

    // Use admin client to bypass RLS, but verify ownership first
    const { data: notif } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!notif || notif.user_id !== userId) {
      return NextResponse.json(
        { ok: false, error: "Not found or not authorized" },
        { status: 404 },
      );
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete notification:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to delete" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notification delete error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
