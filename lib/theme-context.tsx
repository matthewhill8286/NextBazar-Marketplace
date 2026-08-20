"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  /** The user-chosen mode (light / dark / system) */
  mode: ThemeMode;
  /** The resolved appearance — what the UI actually renders */
  resolved: "light" | "dark";
  /** Switch mode and persist to cookie */
  setMode: (mode: ThemeMode) => void;
};

const COOKIE_NAME = "theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

// ─── Context ────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Read the theme cookie (client-side only). */
function readCookie(): ThemeMode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`),
  );
  const value = match?.[1];
  if (value === "light" || value === "dark" || value === "system") return value;
  return null;
}

/** Write the theme cookie. */
function writeCookie(mode: ThemeMode) {
  document.cookie = `${COOKIE_NAME}=${mode};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
}

/** Get the system preference via matchMedia. */
function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply or remove the `dark` class on <html>. */
function applyClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────

/**
 * ThemeProvider
 *
 * On the server, the middleware reads the `theme` cookie and injects
 * `class="dark"` on `<html>` so the first paint is correct.
 *
 * On the client, this provider:
 * 1. Reads the cookie to initialise mode
 * 2. Listens to `prefers-color-scheme` changes for "system" mode
 * 3. Keeps the `<html>` class in sync
 * 4. Writes the cookie on mode change
 *
 * @param children
 * @param initialMode — pre-resolved from cookie on the server to avoid hydration mismatch
 */
export function ThemeProvider({
  children,
  initialMode = "system",
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [systemPref, setSystemPref] = useState<"light" | "dark">(
    // On the server, fall back to light — the middleware handles the class
    typeof window !== "undefined" ? getSystemPreference() : "light",
  );

  const resolved: "light" | "dark" = mode === "system" ? systemPref : mode;

  // Listen for OS preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e: MediaQueryListEvent) {
      setSystemPref(e.matches ? "dark" : "light");
    }
    // Set initial value from media query (may differ from SSR assumption)
    setSystemPref(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keep <html> class in sync with resolved theme
  useEffect(() => {
    applyClass(resolved);
  }, [resolved]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    writeCookie(newMode);
  }, []);

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
