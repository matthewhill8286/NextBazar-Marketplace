import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { COPY } from "./data";
import { useStore } from "./store";

function KeyMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5 text-brass"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="8" cy="12" r="3.2" />
      <path d="M11.2 12h9.3M17.4 12v3.2M20.5 12v2.2" />
    </svg>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { locale, setLocale, role, setRole, reset } = useStore();
  const t = locale === "el" ? COPY.el : COPY.en;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_500px_at_10%_-10%,rgba(196,165,116,0.12),transparent_55%)]" />
      <header className="relative z-10 border-b border-line/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <KeyMark />
            <span className="font-serif text-xl tracking-tight text-ink">
              {t.wordmark}
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Toggle
              a="EN"
              b="EL"
              on={locale === "el"}
              onClick={() => setLocale(locale === "el" ? "en" : "el")}
            />
            <Toggle
              a={t.buyer}
              b={t.lawyer}
              on={role === "lawyer"}
              onClick={() => setRole(role === "lawyer" ? "buyer" : "lawyer")}
            />
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-line px-3 py-1 text-mute hover:text-ink"
            >
              {t.reset}
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-5 py-10">{children}</main>
    </div>
  );
}

function Toggle({
  a,
  b,
  on,
  onClick,
}: {
  a: string;
  b: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex rounded-full border border-line bg-panel p-0.5 text-xs"
    >
      <span
        className={`rounded-full px-2.5 py-1 ${on ? "text-mute" : "bg-panel-2 text-ink"}`}
      >
        {a}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 ${on ? "bg-brass text-paper" : "text-mute"}`}
      >
        {b}
      </span>
    </button>
  );
}

export function DealNav({ id }: { id: string }) {
  const { locale } = useStore();
  const t = locale === "el" ? COPY.el : COPY.en;
  const tab = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-3 py-1 text-sm no-underline ${
          isActive ? "bg-brass text-paper" : "text-mute hover:text-ink"
        }`
      }
    >
      {label}
    </NavLink>
  );
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {tab(`/deal/${id}`, t.workspace)}
      {tab(`/deal/${id}/vault`, t.vault)}
      <Link to="/" className="ml-auto text-sm text-mute no-underline hover:text-ink">
        {t.home}
      </Link>
    </div>
  );
}

export function Pill({
  children,
  tone = "mute",
}: {
  children: ReactNode;
  tone?: "mute" | "ok" | "warn" | "bad" | "brass";
}) {
  const map = {
    mute: "border-line text-mute",
    ok: "border-ok/40 text-ok",
    warn: "border-warn/40 text-warn",
    bad: "border-bad/40 text-bad",
    brass: "border-brass/40 text-brass",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wide text-mute">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-ink outline-none focus:border-brass";

export const btnClass =
  "inline-flex items-center justify-center rounded-full bg-brass px-5 py-2.5 font-medium text-paper no-underline hover:bg-brass-dim";

export const ghostBtn =
  "inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-ink no-underline hover:border-brass";
