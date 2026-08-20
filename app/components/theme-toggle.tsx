"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type ThemeMode, useTheme } from "@/lib/theme-context";

const OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
  { mode: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const ActiveIcon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2.5 text-[#6b6560] hover:text-[#1a1a1a] dark:text-[#9a9290] dark:hover:text-white transition-colors"
        aria-label={`Theme: ${mode}`}
      >
        <ActiveIcon className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 w-36 bg-white dark:bg-[#2C2826] border border-[#e8e6e3] dark:border-[#444] shadow-lg py-1">
            {OPTIONS.map(({ mode: m, icon: Icon, label }) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm w-full transition-colors ${
                  mode === m
                    ? "text-[#8E7A6B] font-medium bg-[#faf9f7] dark:bg-[#3a3533]"
                    : "text-[#666] dark:text-[#aaa] hover:bg-[#faf9f7] dark:hover:bg-[#3a3533]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
