/**
 * Hand-crafted SVG illustrations and decorative elements.
 *
 * These replace generic emojis and stock imagery with bespoke line art,
 * geometric patterns, and abstract shapes that give NextBazar its own identity.
 */

// ─── Hero decorative blobs ──────────────────────────────────────────────────

/** Large abstract blob used as a background decoration in the hero section. */
export function HeroBlob({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M400 50C520 50 620 100 680 180C740 260 760 360 720 440C680 520 580 560 480 570C380 580 280 560 200 500C120 440 80 340 100 260C120 180 280 50 400 50Z"
        fill="url(#hero-grad)"
        opacity="0.12"
      />
      <path
        d="M350 120C430 90 540 130 590 210C640 290 630 400 570 460C510 520 390 530 310 480C230 430 200 330 220 260C240 190 270 150 350 120Z"
        fill="url(#hero-grad-2)"
        opacity="0.08"
      />
      <defs>
        <linearGradient id="hero-grad" x1="0" y1="0" x2="800" y2="600">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="hero-grad-2" x1="200" y1="100" x2="600" y2="500">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Geometric grid pattern for section backgrounds. */
export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <pattern
          id="grid-fine"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.07"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-fine)" />
    </svg>
  );
}

// ─── Category illustrations ─────────────────────────────────────────────────

/** Minimal line-art illustration for Electronics. */
export function ElectronicsIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="8"
        y="12"
        width="48"
        height="32"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="24"
        y1="44"
        x2="24"
        y2="52"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="40"
        y1="44"
        x2="40"
        y2="52"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="18"
        y1="52"
        x2="46"
        y2="52"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="32"
        cy="28"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

/** Minimal line-art illustration for Fashion. */
export function FashionIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M24 8L16 20V56H48V20L40 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 8C24 8 24 16 32 16C40 16 40 8 40 8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="16"
        y1="20"
        x2="48"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}

/** Minimal line-art illustration for Furniture. */
export function FurnitureIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 40V28C12 24 16 20 20 20H44C48 20 52 24 52 28V40"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="8"
        y="40"
        width="48"
        height="8"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="14"
        y1="48"
        x2="14"
        y2="56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="48"
        x2="50"
        y2="56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Minimal line-art illustration for Vehicles. */
export function VehicleIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 38H56V44C56 46 54 48 52 48H12C10 48 8 46 8 44V38Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 38L18 24H46L52 38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="48" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="44" cy="48" r="5" stroke="currentColor" strokeWidth="2" />
      <line
        x1="22"
        y1="30"
        x2="42"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}

/** Minimal line-art illustration for Property. */
export function PropertyIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 32L32 12L56 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="16"
        y="32"
        width="32"
        height="24"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="26"
        y="40"
        width="12"
        height="16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="20"
        y="36"
        width="6"
        height="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <rect
        x="38"
        y="36"
        width="6"
        height="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

// ─── Empty state illustrations ──────────────────────────────────────────────

/** Empty inbox / no messages illustration. */
export function EmptyInboxIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="20"
        y="30"
        width="80"
        height="56"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M20 42L60 66L100 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="52" r="3" fill="currentColor" opacity="0.15" />
      <path
        d="M44 20L60 30L76 20"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** No search results illustration. */
export function EmptySearchIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="52" cy="52" r="28" stroke="currentColor" strokeWidth="2.5" />
      <line
        x1="72"
        y1="72"
        x2="100"
        y2="100"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M42 48H62"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M42 56H58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** No listings / empty marketplace illustration. */
export function EmptyListingsIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="15"
        y="25"
        width="40"
        height="50"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="65"
        y="25"
        width="40"
        height="50"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
      />
      <rect
        x="40"
        y="35"
        width="40"
        height="50"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.2"
      />
      <line
        x1="22"
        y1="60"
        x2="48"
        y2="60"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <line
        x1="22"
        y1="66"
        x2="40"
        y2="66"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
      />
      <path
        d="M50 95L60 85L70 95"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <line
        x1="60"
        y1="85"
        x2="60"
        y2="105"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Empty saved items illustration. */
export function EmptySavedIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M60 95L25 60C15 50 15 33 25 23C35 13 50 13 60 25C70 13 85 13 95 23C105 33 105 50 95 60L60 95Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 80L35 58C29 52 29 42 35 36C41 30 50 30 56 36"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
      />
    </svg>
  );
}

/** Authentication / login illustration. */
export function AuthIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="100" cy="80" r="35" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="68" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M72 92C72 92 80 110 100 110C120 110 128 92 128 92"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="60"
        y="130"
        width="80"
        height="40"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="100" cy="148" r="6" stroke="currentColor" strokeWidth="2" />
      <line
        x1="100"
        y1="154"
        x2="100"
        y2="162"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Decorative dots */}
      <circle cx="40" cy="40" r="3" fill="currentColor" opacity="0.1" />
      <circle cx="160" cy="40" r="3" fill="currentColor" opacity="0.1" />
      <circle cx="30" cy="120" r="2" fill="currentColor" opacity="0.08" />
      <circle cx="170" cy="120" r="2" fill="currentColor" opacity="0.08" />
      <circle cx="45" cy="170" r="4" fill="currentColor" opacity="0.06" />
      <circle cx="155" cy="170" r="4" fill="currentColor" opacity="0.06" />
    </svg>
  );
}

/** Marketplace / storefront illustration for the homepage. */
export function MarketplaceIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Storefront */}
      <rect
        x="60"
        y="100"
        width="280"
        height="160"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M60 100L80 50H320L340 100"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Awning scallops */}
      <path
        d="M60 100C60 100 80 120 100 100C120 80 140 100 140 100C140 100 160 120 180 100C200 80 220 100 220 100C220 100 240 120 260 100C280 80 300 100 300 100C300 100 320 120 340 100"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      {/* Window displays */}
      <rect
        x="80"
        y="130"
        width="100"
        height="80"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="220"
        y="130"
        width="100"
        height="80"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Door */}
      <rect
        x="190"
        y="170"
        width="20"
        height="50"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="205" cy="195" r="2" fill="currentColor" opacity="0.4" />
      {/* Items in windows */}
      <rect
        x="92"
        y="145"
        width="24"
        height="30"
        rx="2"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <rect
        x="124"
        y="155"
        width="20"
        height="20"
        rx="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <rect
        x="232"
        y="145"
        width="30"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <rect
        x="272"
        y="150"
        width="16"
        height="28"
        rx="2"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      {/* Decorative elements */}
      <circle cx="50" cy="60" r="6" fill="currentColor" opacity="0.05" />
      <circle cx="350" cy="60" r="8" fill="currentColor" opacity="0.05" />
      <path
        d="M20 240H380"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.1"
      />
    </svg>
  );
}

/** Not found (404) illustration. */
export function NotFoundIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="100"
        cy="70"
        r="50"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.15"
      />
      <circle
        cx="100"
        cy="70"
        r="35"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <text
        x="100"
        y="78"
        textAnchor="middle"
        fill="currentColor"
        fontSize="28"
        fontWeight="bold"
        opacity="0.6"
        fontFamily="system-ui"
      >
        ?
      </text>
      <path
        d="M60 130C60 130 75 120 100 120C125 120 140 130 140 130"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Decorative accent shapes ───────────────────────────────────────────────

/** Floating abstract shapes for background decoration. */
export function FloatingShapes({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Large circle */}
      <circle
        cx="500"
        cy="80"
        r="120"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.06"
      />
      {/* Ring */}
      <circle
        cx="80"
        cy="320"
        r="60"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.08"
      />
      {/* Diamond */}
      <path
        d="M300 20L340 60L300 100L260 60Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.06"
      />
      {/* Cross */}
      <path
        d="M530 280L530 320M510 300L550 300"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.08"
      />
      {/* Small dots */}
      <circle cx="150" cy="60" r="3" fill="currentColor" opacity="0.06" />
      <circle cx="450" cy="350" r="4" fill="currentColor" opacity="0.05" />
      <circle cx="200" cy="200" r="2" fill="currentColor" opacity="0.07" />
    </svg>
  );
}

/** Diagonal line accent for section dividers. */
export function DiagonalAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 100"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M0 100L1200 0V100H0Z" fill="currentColor" />
    </svg>
  );
}
