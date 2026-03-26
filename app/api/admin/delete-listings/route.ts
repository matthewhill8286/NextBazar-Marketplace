import { NextResponse } from "next/server";

// Temporary: create promo_codes table and seed codes via Supabase SQL API
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Use the PostgREST SQL endpoint (pg_net extension not needed)
  // Supabase exposes a /rest/v1/rpc endpoint but we need raw SQL.
  // Instead, we'll use the Supabase Management API via pg/query
  // Actually, the simplest approach: use the project ref + management API

  // Extract project ref from URL
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

  const sql = `
    CREATE TABLE IF NOT EXISTS public.promo_codes (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code        text NOT NULL UNIQUE,
      redeemed_by uuid REFERENCES public.profiles(id),
      redeemed_at timestamptz,
      created_at  timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

    INSERT INTO public.promo_codes (code) VALUES
      ('NEXTPRO-A1B2C3'),
      ('NEXTPRO-D4E5F6'),
      ('NEXTPRO-G7H8J9'),
      ('NEXTPRO-K2L3M4'),
      ('NEXTPRO-N5P6Q7'),
      ('NEXTPRO-R8S9T1'),
      ('NEXTPRO-U2V3W4'),
      ('NEXTPRO-X5Y6Z7'),
      ('NEXTPRO-F3G4H5'),
      ('NEXTPRO-J6K7L8')
    ON CONFLICT (code) DO NOTHING;
  `;

  // Try using Supabase's pg endpoint (available in newer Supabase)
  const pgRes = await fetch(`${supabaseUrl}/pg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (pgRes.ok) {
    const result = await pgRes.json();
    return NextResponse.json({ method: "pg", result });
  }

  // Fallback: try the SQL endpoint via management API
  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (mgmtRes.ok) {
    const result = await mgmtRes.json();
    return NextResponse.json({ method: "management", result });
  }

  // Last resort: try creating a temporary function, calling it, then dropping
  const createFnRes = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=representation",
    },
  });

  return NextResponse.json({
    error: "Could not execute SQL",
    pg_status: pgRes.status,
    pg_body: await pgRes.text().catch(() => ""),
    mgmt_status: mgmtRes.status,
    mgmt_body: await mgmtRes.text().catch(() => ""),
    hint: "Run the migration SQL manually via the Supabase Dashboard SQL editor",
  });
}
