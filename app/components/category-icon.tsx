import {
  Laptop,
  Shirt,
  Sofa,
  Briefcase,
  Building2,
  Wrench,
  Dumbbell,
  Car,
  Tag,
  type LucideIcon,
} from "lucide-react";

// ─── Per-category config ─────────────────────────────────────────────────────

export interface CategoryConfig {
  Icon: LucideIcon;
  /** Tailwind bg class for a light tinted background */
  bg: string;
  /** Tailwind text class for the icon colour */
  color: string;
  /** Tailwind gradient classes (from / to) for full-bleed backgrounds */
  gradient: string;
  /** Hex accent used where Tailwind isn't available (e.g. inline styles) */
  accent: string;
}

const CONFIG: Record<string, CategoryConfig> = {
  electronics: {
    Icon: Laptop,
    bg: "bg-blue-50",
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-400",
    accent: "#3B82F6",
  },
  fashion: {
    Icon: Shirt,
    bg: "bg-pink-50",
    color: "text-pink-500",
    gradient: "from-pink-500 to-rose-400",
    accent: "#EC4899",
  },
  furniture: {
    Icon: Sofa,
    bg: "bg-amber-50",
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-400",
    accent: "#F59E0B",
  },
  jobs: {
    Icon: Briefcase,
    bg: "bg-purple-50",
    color: "text-purple-500",
    gradient: "from-purple-500 to-violet-400",
    accent: "#8B5CF6",
  },
  property: {
    Icon: Building2,
    bg: "bg-emerald-50",
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-400",
    accent: "#10B981",
  },
  services: {
    Icon: Wrench,
    bg: "bg-orange-50",
    color: "text-orange-500",
    gradient: "from-orange-500 to-red-400",
    accent: "#F97316",
  },
  sports: {
    Icon: Dumbbell,
    bg: "bg-green-50",
    color: "text-green-500",
    gradient: "from-green-500 to-lime-400",
    accent: "#22C55E",
  },
  vehicles: {
    Icon: Car,
    bg: "bg-slate-50",
    color: "text-slate-500",
    gradient: "from-slate-600 to-slate-400",
    accent: "#64748B",
  },
};

const FALLBACK: CategoryConfig = {
  Icon: Tag,
  bg: "bg-gray-50",
  color: "text-gray-400",
  gradient: "from-gray-400 to-gray-300",
  accent: "#9CA3AF",
};

export function getCategoryConfig(slug: string | null | undefined): CategoryConfig {
  if (!slug) return FALLBACK;
  return CONFIG[slug.toLowerCase()] ?? FALLBACK;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CategoryIconProps {
  slug: string | null | undefined;
  /** Size in px passed to the Lucide icon (default 20) */
  size?: number;
  /** Extra classes on the <svg> element */
  className?: string;
}

export default function CategoryIcon({ slug, size = 20, className = "" }: CategoryIconProps) {
  const { Icon, color } = getCategoryConfig(slug);
  return <Icon size={size} className={`${color} ${className}`.trim()} />;
}
