/**
 * SEO helpers — canonical URLs, locale alternates, and JSON-LD generators.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";
const LOCALES = ["en", "el", "ru"] as const;

// ─── Canonical + hreflang alternates ────────────────────────────────────────

/**
 * Generates `alternates` metadata for a given path.
 * @param path – path WITHOUT locale prefix, e.g. "/search" or "/listing/my-item"
 * @param currentLocale – optional, sets canonical to that locale variant
 */
export function buildAlternates(path: string, currentLocale?: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const canonical = currentLocale
    ? `${BASE_URL}/${currentLocale}${clean}`
    : `${BASE_URL}${clean}`;

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${clean}`;
  }
  languages["x-default"] = `${BASE_URL}/en${clean}`;

  return { canonical, languages };
}

// ─── JSON-LD helpers ────────────────────────────────────────────────────────

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NextBazar",
    url: BASE_URL,
    logo: `${BASE_URL}/nextbazar-icon.svg`,
    description:
      "Cyprus's AI-powered marketplace for buying and selling vehicles, property, electronics, and more.",
    areaServed: {
      "@type": "Country",
      name: "Cyprus",
    },
    sameAs: [] as string[],
  };
}

export interface ProductJsonLdInput {
  name: string;
  description: string;
  image?: string;
  price?: number;
  currency?: string;
  url: string;
  seller?: string;
  condition?: string;
}

export function productJsonLd(input: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    ...(input.image && { image: input.image }),
    url: input.url,
    ...(input.seller && {
      offers: {
        "@type": "Offer",
        priceCurrency: input.currency || "EUR",
        ...(input.price != null && { price: input.price }),
        availability:
          "https://schema.org/InStock",
        seller: {
          "@type": "Person",
          name: input.seller,
        },
      },
    }),
    ...(input.condition && {
      itemCondition:
        input.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    }),
  };
}

export interface LocalBusinessJsonLdInput {
  name: string;
  description?: string;
  url: string;
  image?: string;
}

export function localBusinessJsonLd(input: LocalBusinessJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: input.name,
    ...(input.description && { description: input.description }),
    url: input.url,
    ...(input.image && { image: input.image }),
    areaServed: {
      "@type": "Country",
      name: "Cyprus",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(
  items: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export { BASE_URL, LOCALES };
