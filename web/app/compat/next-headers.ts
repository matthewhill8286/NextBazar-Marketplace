import { getRequestStore, tryGetRequestStore } from "@/lib/request-context";

function parseCookies(header: string): { name: string; value: string }[] {
  if (!header) return [];
  return header.split(";").flatMap((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return [];
    return [
      {
        name: part.slice(0, idx).trim(),
        value: decodeURIComponent(part.slice(idx + 1).trim()),
      },
    ];
  });
}

export async function cookies() {
  const store = tryGetRequestStore();
  const all = parseCookies(store?.request.headers.get("Cookie") ?? "");
  return {
    get(name: string) {
      return all.find((c) => c.name === name);
    },
    getAll() {
      return all;
    },
    set(name: string, value: string, options?: { path?: string; maxAge?: number }) {
      if (!store) return;
      const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options?.path ?? "/"}`];
      if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`);
      store.responseHeaders.append("Set-Cookie", parts.join("; "));
    },
  };
}

export async function headers() {
  const store = getRequestStore();
  return store.request.headers;
}
