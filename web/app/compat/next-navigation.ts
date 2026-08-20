import {
  redirect as localeRedirect,
  usePathname as useLocalePathname,
  useRouter as useLocaleRouter,
} from "@/i18n/navigation";
import { useParams as useRRParams, useSearchParams as useRRSearchParams } from "react-router";

export function redirect(url: string): never {
  localeRedirect(url);
}

export function notFound(): never {
  throw new Response("Not Found", { status: 404, statusText: "Not Found" });
}

export function usePathname() {
  return useLocalePathname();
}

export function useRouter() {
  return useLocaleRouter();
}

export function useSearchParams() {
  const [params] = useRRSearchParams();
  return params;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useRRParams() as T;
}

export function useSelectedLayoutSegment(): string | null {
  return null;
}
