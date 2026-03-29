/**
 * Shared UI primitives — small building-block components used across the app.
 *
 * Import from "@/app/components/ui" instead of copy-pasting Tailwind classes.
 */

import { Loader2 } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  EmptyListingsIllustration,
} from "@/app/components/illustrations";

// ─── Form primitives ──────────────────────────────────────────────────────────

const INPUT_BASE =
  "w-full px-4 py-3 border border-[#e8e6e3] focus:border-[#8E7A6B] focus:ring-2 focus:ring-[#8E7A6B]/5 outline-none text-sm bg-white transition-colors";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Optional prefix symbol rendered inside the left of the input (e.g. "\u20AC") */
  prefix?: string;
};

/** Standard single-line text input with consistent app styling. */
export function FormInput({
  prefix,
  className = "",
  ...props
}: FormInputProps) {
  if (prefix) {
    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] font-medium pointer-events-none">
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
    <textarea className={`${INPUT_BASE} resize-none ${className}`} {...props} />
  );
}

/** Standard select dropdown with consistent app styling. */
export function FormSelect({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${INPUT_BASE} ${className}`} {...props} />;
}

// ─── Feedback banners ─────────────────────────────────────────────────────────

/** Red inline error banner. Pass `null` / `""` to hide. */
export function ErrorBanner({
  message,
}: {
  message: string | null | undefined;
}) {
  if (!message) return null;
  return (
    <div className="bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-100">
      {message}
    </div>
  );
}

/** Green inline success banner. Pass `null` / `""` to hide. */
export function SuccessBanner({
  message,
}: {
  message: string | null | undefined;
}) {
  if (!message) return null;
  return (
    <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 border border-emerald-100">
      {message}
    </div>
  );
}

// ─── Loading states ───────────────────────────────────────────────────────────

type SpinnerSize = "sm" | "md" | "lg";

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

/**
 * Centred full-area loading spinner.
 * Wraps itself in a flex container so it fills its parent.
 */
export function LoadingSpinner({ size = "md" }: { size?: SpinnerSize }) {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2
        className={`${SPINNER_SIZES[size]} text-[#999] animate-spin`}
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
 * Uses SVG illustration instead of emoji for a cleaner look.
 *
 * @example
 * <EmptyState title="No active listings" description="Post something to get started." />
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
      className={`bg-white border border-[#e8e6e3] p-14 text-center ${className}`}
    >
      {/* Use illustration instead of emoji when possible */}
      {emoji ? (
        <div className="text-4xl mb-4">{emoji}</div>
      ) : (
        <EmptyListingsIllustration className="w-16 h-16 mx-auto mb-4 text-[#ccc]" />
      )}
      <p
        className="font-light text-xl text-[#1a1a1a] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </p>
      {description && (
        <p className="text-[#999] text-sm max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  /** Icon rendered above the title */
  icon?: ReactNode;
  /** Text on the confirm button — defaults to "Confirm" */
  confirmLabel?: string;
  /** Text on the cancel button — defaults to "Cancel" */
  cancelLabel?: string;
  /** Tailwind classes for the confirm button — defaults to dark */
  confirmClassName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A modal confirmation dialog with backdrop blur.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmClassName = "bg-[#8E7A6B] hover:bg-[#7A6657]",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h3
          className="text-xl font-light text-[#1a1a1a] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[#999] mb-6">{description}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-[#e8e6e3] text-sm font-medium text-[#666] hover:bg-[#faf9f7] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-white text-sm font-medium tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClassName}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
