import { createBrowserClient } from "@supabase/ssr";

function publicEnv(name: string): string {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };
  return (
    meta.env?.[name] ??
    meta.env?.[`VITE_${name.replace(/^NEXT_PUBLIC_/, "")}`] ??
    process.env[name] ??
    ""
  );
}

export function createClient() {
  return createBrowserClient(
    publicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
