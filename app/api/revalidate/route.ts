import { NextResponse } from "next/server";
import { revalidateAll } from "@/app/actions/revalidate";

/**
 * GET /api/revalidate — bust all data caches.
 * Useful after seeding data or making direct DB changes.
 * Only available in development.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await revalidateAll();
  return NextResponse.json({ ok: true, message: "All caches revalidated" });
}
