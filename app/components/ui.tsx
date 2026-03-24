/**
 * Shared UI primitives — small building-block components used across the app.
 *
 * Import from "@/app/components/ui" instead of copy-pasting Tailwind classes.
 */

import { Loader2 } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// ─── Form primitives ──────────────────────────────────────────────────────────

const INPUT_BASE =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Optional prefix symbol rendered inside the left of the input (e.g. "€") */
  prefix?: string;
};

/** Standard single-line text input with consistent app styling. */
export function FormInput({ prefix, className = "", ...props }: FormInputProps) {
  if (prefix) {
    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
          {prefix}
        </span>
        <input className={`${INPUT_BASE} pl-8 ${className}`} {...props} />
      </div>
    );
  }
  return <input className={`${INPUT_BASE} ${className}`} {...props} />;
}

/** Standard textarea with consistent app styling. */
export function FormTextarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${INPUT_BASE} resize-none ${className}`}
      {...props}
    />
  );
}

/** Standard select dropdown with consistent app styling. */
export function FormSelect({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${INPUT_BASE} ${className}`} {...props} />
  );
}

// ─── Feedback banners ─────────────────────────────────────────────────────────

/** Red inline error banner. Pass `null` / `""` to hide. */
export function ErrorBanner({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
      {message}
    </div>
  );
}

/** Green inline success banner. Pass `null` / `""` to hide. */
export function SuccessBanner({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
      {message}
    </div>
  );
}

// ─── Loading states ───────────────────────────────────────────────────────────

type SpinnerSize = "sm" | "md" | "lg";

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * Centred full-area loading spinner.
 * Wraps itself in a flex container so it fills its parent.
 */
export function LoadingSpinner({ size = "md" }: { size?: SpinnerSize }) {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2
        className={`${SPINNER_SIZES[size]} text-indigo-500 animate-spin`}
      />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

type EmptyStateProps = {
  emoji?: string;
  title: string;
  description?: string;
  /** Optional CTA rendered below the text */
  action?: React.ReactNode;
  /** Extra wrapper className */
  className?: string;
};

/**
 * Consistent empty-state card used when a list has no items.
 *
 * @example
 * <EmptyState emoji="📦" title="No active listings" description="Post something to get started." />
 */
export function EmptyState({
  emoji,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-12 text-center ${className}`}
    >
      {emoji && <div className="text-4xl mb-3">{emoji}</div>}
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      {description && (
        <p className="text-gray-400 text-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
