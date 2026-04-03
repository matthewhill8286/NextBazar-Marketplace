"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Country = { code: string; dial: string; flag: string; name: string };

const COUNTRIES: Country[] = [
  { code: "CY", dial: "+357", flag: "🇨🇾", name: "Cyprus" },
  { code: "GR", dial: "+30", flag: "🇬🇷", name: "Greece" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "DE", dial: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "IT", dial: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "ES", dial: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "RU", dial: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "TR", dial: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "LB", dial: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "IL", dial: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "EG", dial: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "RO", dial: "+40", flag: "🇷🇴", name: "Romania" },
  { code: "BG", dial: "+359", flag: "🇧🇬", name: "Bulgaria" },
  { code: "PL", dial: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "NL", dial: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "SE", dial: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "AT", dial: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "BE", dial: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "CH", dial: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "IE", dial: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "DK", dial: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "NO", dial: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "FI", dial: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa" },
];

// Sort once by longest dial code for correct matching
const COUNTRIES_BY_DIAL_LENGTH = [...COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length,
);

function detectCountry(phone: string): Country {
  if (!phone) return COUNTRIES[0];
  const cleaned = phone.replace(/\s/g, "");
  for (const c of COUNTRIES_BY_DIAL_LENGTH) {
    if (cleaned.startsWith(c.dial)) return c;
  }
  return COUNTRIES[0];
}

function stripDial(phone: string, dial: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith(dial)) return cleaned.slice(dial.length).trim();
  if (cleaned.startsWith("+")) {
    const match = cleaned.match(/^\+\d{1,4}/);
    return match ? cleaned.slice(match[0].length).trim() : cleaned;
  }
  return cleaned;
}

type PhoneInputProps = {
  value: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
  focusClass?: string;
};

export default function PhoneInput({
  value,
  onChangeAction,
  placeholder = "99 123456",
  focusClass = "focus-within:border-[#8E7A6B] focus-within:ring-2 focus-within:ring-[#8E7A6B]/10",
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(() => detectCountry(value));
  const [localNumber, setLocalNumber] = useState(() =>
    stripDial(value, detectCountry(value).dial),
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  function emitChange(dial: string, num: string) {
    onChangeAction(num ? `${dial} ${num}` : "");
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setOpen(false);
    setSearch("");
    emitChange(c.dial, localNumber);
    // Focus the number input after selecting a country
    setTimeout(() => phoneRef.current?.focus(), 0);
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const num = e.target.value.replace(/[^\d\s]/g, "");
    setLocalNumber(num);
    emitChange(country.dial, num);
  }

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center border border-[#e8e6e3] bg-white transition-all ${focusClass}`}
      >
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 pl-3.5 pr-2 py-3 text-sm text-[#666] hover:bg-[#faf9f7] transition-colors shrink-0 rounded-l-xl"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="font-medium text-[#666]">{country.dial}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#8a8280] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#e8e6e3] shrink-0" />

        {/* Phone number input */}
        <input
          ref={phoneRef}
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 text-sm outline-none bg-transparent min-w-0 rounded-r-xl"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-[#e8e6e3] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search input */}
          <div className="p-2 border-b border-[#e8e6e3]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8280]" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-[#e8e6e3] outline-none focus-visible:border-[#8E7A6B] focus:ring-1 focus:ring-[#8E7A6B]/10 bg-[#faf9f7]"
              />
            </div>
          </div>

          {/* Country list */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <p className="text-xs text-[#8a8280] text-center py-6">
                No countries found
              </p>
            )}
            {filtered.map((c) => {
              const isSelected = c.code === country.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-[#f0eeeb] text-[#7A6657]"
                      : "text-[#666] hover:bg-[#faf9f7]"
                  }`}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="flex-1 text-left truncate font-medium">
                    {c.name}
                  </span>
                  <span className="text-xs text-[#8a8280] font-mono tabular-nums">
                    {c.dial}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#8E7A6B] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
