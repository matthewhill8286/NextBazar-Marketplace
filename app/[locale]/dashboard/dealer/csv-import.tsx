"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Shuffle,
  Sparkles,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useReferenceData } from "@/lib/hooks/use-reference-data";

// ─── Column definitions ────────────────────────────────────────────────────

const REQUIRED_COLUMNS = ["title", "category"] as const;

const ALL_COLUMNS = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", required: false },
  { key: "price", label: "Price", required: false },
  { key: "price_type", label: "Price Type", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "category", label: "Category", required: true },
  { key: "subcategory", label: "Subcategory", required: false },
  { key: "location", label: "Location", required: false },
  { key: "contact_phone", label: "Phone", required: false },
  { key: "image_url", label: "Image URL", required: false },
  // Vehicle attributes
  { key: "make", label: "Make", required: false },
  { key: "model", label: "Model", required: false },
  { key: "year", label: "Year", required: false },
  { key: "mileage", label: "Mileage", required: false },
  { key: "fuel_type", label: "Fuel Type", required: false },
  { key: "transmission", label: "Transmission", required: false },
  { key: "body_type", label: "Body Type", required: false },
  { key: "color", label: "Color", required: false },
  { key: "engine_size", label: "Engine Size", required: false },
  { key: "doors", label: "Doors", required: false },
  { key: "drive_type", label: "Drive Type", required: false },
  // Stock management
  { key: "quantity", label: "Quantity", required: false },
  { key: "low_stock_threshold", label: "Low Stock Alert", required: false },
  // Property attributes
  { key: "property_type", label: "Property Type", required: false },
  { key: "bedrooms", label: "Bedrooms", required: false },
  { key: "bathrooms", label: "Bathrooms", required: false },
  { key: "area_sqm", label: "Area (m²)", required: false },
  { key: "furnishing", label: "Furnishing", required: false },
] as const;

const COLUMN_KEYS = ALL_COLUMNS.map((c) => c.key);

const VEHICLE_ATTR_KEYS = [
  "make", "model", "year", "mileage", "fuel_type", "transmission",
  "body_type", "color", "engine_size", "doors", "drive_type",
];

const PROPERTY_ATTR_KEYS = [
  "property_type", "bedrooms", "bathrooms", "area_sqm", "furnishing",
];

const ALL_ATTR_KEYS = [...VEHICLE_ATTR_KEYS, ...PROPERTY_ATTR_KEYS];

// ─── Smart column matching aliases ─────────────────────────────────────────

const COLUMN_ALIASES: Record<string, string[]> = {
  title: ["title", "name", "listing_title", "listing_name", "product", "product_name", "item", "headline", "ad_title"],
  description: ["description", "desc", "details", "body", "text", "about", "summary", "listing_description"],
  price: ["price", "cost", "amount", "asking_price", "list_price", "sale_price", "value"],
  price_type: ["price_type", "pricing", "pricing_type", "type_of_price", "negotiable"],
  condition: ["condition", "state", "quality", "item_condition"],
  category: ["category", "cat", "type", "listing_type", "product_type", "main_category"],
  subcategory: ["subcategory", "sub_category", "subcat", "sub", "sub_type"],
  location: ["location", "city", "area", "region", "district", "town", "place", "address"],
  contact_phone: ["contact_phone", "phone", "tel", "telephone", "mobile", "cell", "phone_number", "contact"],
  image_url: ["image_url", "image", "photo", "photo_url", "picture", "img", "img_url", "thumbnail", "main_image"],
  make: ["make", "brand", "manufacturer"],
  model: ["model", "model_name"],
  year: ["year", "model_year", "yr", "registration_year"],
  mileage: ["mileage", "km", "miles", "odometer", "kilometers", "distance"],
  fuel_type: ["fuel_type", "fuel", "engine_type", "power_source"],
  transmission: ["transmission", "gearbox", "gear", "trans"],
  body_type: ["body_type", "body", "body_style", "car_type", "vehicle_type"],
  color: ["color", "colour", "exterior_color", "paint"],
  engine_size: ["engine_size", "engine", "cc", "displacement", "liters", "litres", "capacity"],
  doors: ["doors", "num_doors", "door_count"],
  drive_type: ["drive_type", "drivetrain", "drive", "wheel_drive"],
  property_type: ["property_type", "property", "prop_type"],
  bedrooms: ["bedrooms", "beds", "bed", "num_bedrooms", "rooms"],
  bathrooms: ["bathrooms", "baths", "bath", "num_bathrooms"],
  area_sqm: ["area_sqm", "area", "sqm", "size", "square_meters", "floor_area", "sq_ft", "sqft"],
  furnishing: ["furnishing", "furnished", "furniture"],
  quantity: ["quantity", "qty", "stock", "in_stock", "stock_count", "units"],
  low_stock_threshold: ["low_stock_threshold", "low_stock", "reorder_level", "min_stock", "alert_at"],
};

/** Build a reverse lookup: alias → canonical column key */
function buildAliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      map.set(alias, canonical);
    }
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

/**
 * Fuzzy-match a raw header string to one of our canonical column keys.
 * Returns the canonical key or null if no match.
 */
function matchColumnHeader(raw: string): string | null {
  const normalized = raw.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  // Exact alias match
  if (ALIAS_MAP.has(normalized)) return ALIAS_MAP.get(normalized)!;
  // Partial match: check if any alias is contained in the header or vice versa
  for (const [alias, canonical] of ALIAS_MAP.entries()) {
    if (alias.length >= 3 && (normalized.includes(alias) || alias.includes(normalized))) {
      return canonical;
    }
  }
  return null;
}

// ─── Types ─────────────────────────────────────────────────────────────────

type ParsedRow = Record<string, string>;

type ValidatedRow = {
  index: number;
  data: ParsedRow;
  errors: string[];
  valid: boolean;
};

type ImportResult = {
  row: number;
  status: "created" | "error";
  title: string;
  slug?: string;
  error?: string;
};

type Phase = "upload" | "mapping" | "preview" | "importing" | "results";
type ColumnMapping = Record<string, string>; // rawHeader → canonicalKey

// ─── CSV Parsing ───────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]).map((h) => h.trim());

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    if (Object.values(row).some((v) => v.length > 0)) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── XLSX Parsing ──────────────────────────────────────────────────────────

async function parseXLSX(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const XLSX = (await import("xlsx")).default;
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (jsonData.length === 0) return { headers: [], rows: [] };

  const headers = Object.keys(jsonData[0]);
  const rows: ParsedRow[] = jsonData.map((row) => {
    const parsed: ParsedRow = {};
    headers.forEach((h) => {
      parsed[h] = String(row[h] ?? "").trim();
    });
    return parsed;
  }).filter((row) => Object.values(row).some((v) => v.length > 0));

  return { headers, rows };
}

// ─── Template generation ───────────────────────────────────────────────────

function generateTemplate(type: "vehicles" | "properties" | "general"): string {
  const base = ["title", "description", "price", "price_type", "condition", "category", "subcategory", "location", "contact_phone", "image_url"];

  let extra: string[] = [];
  if (type === "vehicles") {
    extra = ["make", "model", "year", "mileage", "fuel_type", "transmission", "body_type", "color", "engine_size", "doors", "drive_type"];
  } else if (type === "properties") {
    extra = ["property_type", "bedrooms", "bathrooms", "area_sqm", "furnishing"];
  }

  const headers = [...base, ...extra];
  const exampleRow =
    type === "vehicles"
      ? [
          "2020 BMW 320i M Sport",
          "Well maintained, full service history",
          "25000",
          "negotiable",
          "good",
          "vehicles",
          "cars",
          "limassol",
          "",
          "https://example.com/bmw-320i.jpg",
          "BMW",
          "320i",
          "2020",
          "45000",
          "petrol",
          "automatic",
          "sedan",
          "white",
          "2000",
          "4",
          "rwd",
        ]
      : type === "properties"
        ? [
            "Modern 2-Bed Apartment in Limassol",
            "Sea view, recently renovated",
            "185000",
            "fixed",
            "like_new",
            "property",
            "for-sale",
            "limassol",
            "",
            "https://example.com/apartment.jpg",
            "apartment",
            "2",
            "1",
            "85",
            "furnished",
          ]
        : [
            "Example Listing Title",
            "Description of your item",
            "100",
            "fixed",
            "good",
            "electronics",
            "phones-tablets",
            "nicosia",
            "",
            "https://example.com/item.jpg",
          ];

  return headers.join(",") + "\n" + exampleRow.join(",") + "\n";
}

function downloadTemplate(type: "vehicles" | "properties" | "general") {
  const csv = generateTemplate(type);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nextbazar-import-template-${type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Context-aware column sets ─────────────────────────────────────────────

export type ShopType = "vehicles" | "properties" | "general";

/** Return columns relevant to the detected shop type (always includes base) */
function getContextColumns(shopType: ShopType) {
  const BASE_KEYS = new Set([
    "title", "description", "price", "price_type", "condition",
    "category", "subcategory", "location", "contact_phone", "image_url",
  ]);
  const VEHICLE_KEYS = new Set(VEHICLE_ATTR_KEYS);
  const PROPERTY_KEYS = new Set(PROPERTY_ATTR_KEYS);

  return ALL_COLUMNS.filter((col) => {
    if (BASE_KEYS.has(col.key)) return true;
    if (shopType === "vehicles") return VEHICLE_KEYS.has(col.key);
    if (shopType === "properties") return PROPERTY_KEYS.has(col.key);
    // "general" — exclude vehicle/property specific columns from the dropdown
    return false;
  });
}

/**
 * Detect shop type from existing listings.
 * If >50% of listings are in vehicles → "vehicles", property → "properties", else "general".
 */
export function detectShopType(
  listings: { categories?: { slug: string } | null }[],
): ShopType {
  if (listings.length === 0) return "general";
  let vehicles = 0;
  let properties = 0;
  for (const l of listings) {
    const slug = l.categories?.slug?.toLowerCase();
    if (slug === "vehicles") vehicles++;
    else if (slug === "property") properties++;
  }
  const half = listings.length / 2;
  if (vehicles > half) return "vehicles";
  if (properties > half) return "properties";
  return "general";
}

// ─── Component ─────────────────────────────────────────────────────────────

type Props = {
  onClose: () => void;
  /** Auto-detected from existing inventory — controls which columns/templates are shown */
  shopType?: ShopType;
};

export default function CSVImport({ onClose, shopType = "general" }: Props) {
  const router = useRouter();
  const { categories, subcategories, locations, loading: refLoading } = useReferenceData();

  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    created: number;
    errors: number;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiEnhancedCount, setAiEnhancedCount] = useState(0);

  // ─── AI Enhance: generate descriptions for rows missing them ─────
  const rowsMissingDescription = useMemo(
    () => validatedRows.filter((r) => r.valid && !r.data.description?.trim()),
    [validatedRows],
  );

  const handleAiEnhance = useCallback(async () => {
    if (rowsMissingDescription.length === 0) return;
    setAiEnhancing(true);
    setAiEnhancedCount(0);

    let enhanced = 0;
    // Process in batches of 3 to avoid overloading the API
    for (let i = 0; i < rowsMissingDescription.length; i++) {
      const row = rowsMissingDescription[i];
      try {
        const res = await fetch("/api/ai/describe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: row.data.title,
            category: row.data.category || undefined,
            condition: row.data.condition || undefined,
            price: row.data.price || undefined,
          }),
        });
        if (res.ok) {
          const { description } = await res.json();
          if (description) {
            setValidatedRows((prev) =>
              prev.map((r) =>
                r.index === row.index
                  ? { ...r, data: { ...r.data, description } }
                  : r,
              ),
            );
            enhanced++;
            setAiEnhancedCount(enhanced);
          }
        }
      } catch {
        // Skip failed rows
      }
    }

    setAiEnhancing(false);
  }, [rowsMissingDescription]);

  // Build lookup sets for validation
  const validCategories = useMemo(
    () => new Set(categories.map((c) => c.slug.toLowerCase())),
    [categories],
  );
  const validSubcategories = useMemo(
    () => new Set(subcategories.map((s) => s.slug.toLowerCase())),
    [subcategories],
  );
  const validLocations = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      set.add(l.slug.toLowerCase());
      set.add(l.name.toLowerCase());
    });
    return set;
  }, [locations]);

  // ─── Auto-map columns ──────────────────────────────────────────────
  const autoMapColumns = useCallback((headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    const usedCanonicals = new Set<string>();

    for (const raw of headers) {
      const match = matchColumnHeader(raw);
      if (match && !usedCanonicals.has(match)) {
        mapping[raw] = match;
        usedCanonicals.add(match);
      }
    }
    return mapping;
  }, []);

  // ─── Apply mapping to get canonical rows ───────────────────────────
  const getMappedRows = useCallback(
    (rows: ParsedRow[], mapping: ColumnMapping): ParsedRow[] => {
      return rows.map((raw) => {
        const mapped: ParsedRow = {};
        for (const [rawH, value] of Object.entries(raw)) {
          const canonical = mapping[rawH];
          if (canonical) {
            mapped[canonical] = value;
          }
        }
        return mapped;
      });
    },
    [],
  );

  // ─── Validate a parsed row ─────────────────────────────────────────
  const validateRow = useCallback(
    (data: ParsedRow, index: number): ValidatedRow => {
      const errors: string[] = [];

      if (!data.title || data.title.trim().length < 3) {
        errors.push("Title required (min 3 chars)");
      }

      if (!data.category || !validCategories.has(data.category.toLowerCase())) {
        errors.push(`Invalid category "${data.category || "(empty)"}"`);
      }

      // Subcategory is optional — if it doesn't match a known slug,
      // the server will silently skip it (listing gets no subcategory).
      // No hard error needed here.

      if (data.location && !validLocations.has(data.location.toLowerCase())) {
        errors.push(`Unknown location "${data.location}"`);
      }

      if (data.price && isNaN(Number(data.price))) {
        errors.push("Price must be a number");
      }

      if (data.image_url && !data.image_url.match(/^https?:\/\/.+/i)) {
        errors.push("Image URL must start with http:// or https://");
      }

      return { index, data, errors, valid: errors.length === 0 };
    },
    [validCategories, validLocations],
  );

  // ─── Handle file selection ─────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const isXLSX = file.name.match(/\.xlsx?$/i);

      let headers: string[];
      let rows: ParsedRow[];

      if (isXLSX) {
        const buffer = await file.arrayBuffer();
        const result = await parseXLSX(buffer);
        headers = result.headers;
        rows = result.rows;
      } else {
        const text = await file.text();
        const result = parseCSV(text);
        headers = result.headers;
        rows = result.rows;
      }

      if (headers.length === 0 || rows.length === 0) return;

      setRawHeaders(headers);
      setRawRows(rows);

      // Auto-map columns
      const mapping = autoMapColumns(headers);
      setColumnMapping(mapping);

      // Check if all required columns are mapped — skip to preview
      const mappedKeys = new Set(Object.values(mapping));
      const allRequiredMapped = REQUIRED_COLUMNS.every((r) => mappedKeys.has(r));

      if (allRequiredMapped) {
        // Run validation and go straight to preview
        const mapped = getMappedRows(rows, mapping);
        const validated = mapped.map((row, i) => validateRow(row, i));
        setValidatedRows(validated);
        setPhase("preview");
      } else {
        setPhase("mapping");
      }
    },
    [autoMapColumns, getMappedRows, validateRow],
  );

  // ─── Confirm mapping and proceed to preview ────────────────────────
  const confirmMapping = useCallback(() => {
    const mapped = getMappedRows(rawRows, columnMapping);
    const validated = mapped.map((row, i) => validateRow(row, i));
    setValidatedRows(validated);
    setPhase("preview");
  }, [rawRows, columnMapping, getMappedRows, validateRow]);

  // ─── Drag & drop handling ──────────────────────────────────────────
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.match(/\.(csv|xlsx?)$/i)) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  // ─── Import ────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    const validRows = validatedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setPhase("importing");
    setImportProgress(0);

    const payload = validRows.map((r) => {
      const attrs: Record<string, string> = {};
      for (const key of ALL_ATTR_KEYS) {
        if (r.data[key]?.trim()) {
          attrs[key] = r.data[key].trim();
        }
      }

      return {
        title: r.data.title,
        description: r.data.description || undefined,
        price: r.data.price ? Number(r.data.price) : null,
        price_type: r.data.price_type || "fixed",
        condition: r.data.condition || undefined,
        category_slug: r.data.category,
        subcategory_slug: r.data.subcategory || undefined,
        location_slug: r.data.location || undefined,
        contact_phone: r.data.contact_phone || undefined,
        image_url: r.data.image_url || undefined,
        attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
        quantity: r.data.quantity ? Number(r.data.quantity) : undefined,
        low_stock_threshold: r.data.low_stock_threshold ? Number(r.data.low_stock_threshold) : undefined,
      };
    });

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 3, 85));
    }, 200);

    try {
      const res = await fetch("/api/dealer/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      const data = await res.json();

      if (!res.ok) {
        setResults([
          {
            row: 0,
            status: "error",
            title: "Import failed",
            error: data.error || "Unknown error",
          },
        ]);
        setImportSummary({ total: payload.length, created: 0, errors: payload.length });
      } else {
        setResults(data.results);
        setImportSummary(data.summary);
      }
    } catch {
      clearInterval(progressInterval);
      setResults([
        {
          row: 0,
          status: "error",
          title: "Network error",
          error: "Failed to connect to server",
        },
      ]);
      setImportSummary({ total: payload.length, created: 0, errors: payload.length });
    }

    setImporting(false);
    setPhase("results");
  }, [validatedRows]);

  // ─── Stats ─────────────────────────────────────────────────────────
  const validCount = validatedRows.filter((r) => r.valid).length;
  const errorCount = validatedRows.filter((r) => !r.valid).length;
  const mappedCount = Object.keys(columnMapping).length;
  const mappedKeys = new Set(Object.values(columnMapping));
  const hasRequiredMapped = REQUIRED_COLUMNS.every((r) => mappedKeys.has(r));
  const imageUrlMapped = mappedKeys.has("image_url");
  const imageRowCount = imageUrlMapped
    ? validatedRows.filter((r) => r.valid && r.data.image_url).length
    : 0;

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e8e6e3]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f0eeeb] flex items-center justify-center">
              <FileSpreadsheet className="w-4.5 h-4.5 text-[#6b6560]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1a1a1a]">
                Import Inventory
              </h2>
              <p className="text-xs text-[#8a8280]">
                Bulk-import {shopType === "vehicles" ? "vehicle" : shopType === "properties" ? "property" : ""} listings from CSV or Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#8a8280] hover:text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {phase !== "upload" && phase !== "results" && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#f0eeeb] text-xs">
            {["Upload", "Map Columns", "Preview", "Import"].map((step, i) => {
              const stepPhases = ["upload", "mapping", "preview", "importing"];
              const currentIdx = stepPhases.indexOf(phase);
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <div className="w-6 h-px bg-[#e8e6e3]" />}
                  <div
                    className={`flex items-center gap-1.5 ${
                      isActive
                        ? "text-[#8E7A6B] font-semibold"
                        : isDone
                          ? "text-emerald-600"
                          : "text-[#8a8280]"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span
                        className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold border ${
                          isActive
                            ? "border-[#8E7A6B] text-[#8E7A6B]"
                            : "border-[#e8e6e3] text-[#8a8280]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    )}
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Phase: Upload ─────────────────────────────────────────── */}
          {phase === "upload" && (
            <div className="space-y-6">
              {/* Template downloads — recommended template shown first */}
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-3">
                  1. Download a template
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                      { type: "vehicles" as const, label: "Vehicles" },
                      { type: "properties" as const, label: "Properties" },
                      { type: "general" as const, label: "General" },
                    ]
                    .sort((a, b) => {
                      // Put the matching shop type first
                      if (a.type === shopType) return -1;
                      if (b.type === shopType) return 1;
                      return 0;
                    })
                    .map(({ type, label }) => {
                      const isRecommended = type === shopType;
                      return (
                        <button
                          key={type}
                          onClick={() => downloadTemplate(type)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border transition-colors ${
                            isRecommended
                              ? "bg-[#8E7A6B]/10 text-[#8E7A6B] border-[#8E7A6B]/30 hover:bg-[#8E7A6B]/15"
                              : "bg-[#faf9f7] text-[#666] border-[#e8e6e3] hover:bg-[#f0eeeb]"
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          {label} Template
                          {isRecommended && (
                            <span className="text-[9px] bg-[#8E7A6B] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                              Recommended
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Drop zone */}
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-3">
                  2. Upload your file
                </p>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all group ${
                    dragActive
                      ? "border-[#8E7A6B] bg-[#8E7A6B]/5 scale-[1.01]"
                      : "border-[#e8e6e3] hover:border-[#8E7A6B]"
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 mx-auto mb-3 transition-colors ${
                      dragActive ? "text-[#8E7A6B]" : "text-[#8a8280] group-hover:text-[#8E7A6B]"
                    }`}
                  />
                  <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                    {dragActive
                      ? "Drop your file here"
                      : "Drop your file here, or click to browse"}
                  </p>
                  <p className="text-xs text-[#8a8280]">
                    Supports <strong>.csv</strong> and <strong>.xlsx</strong> files — up to 200 listings
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#faf9f7] border border-[#e8e6e3] p-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#8a8280] mt-0.5 shrink-0" />
                  <div className="text-xs text-[#6b6560] space-y-1">
                    <p className="font-medium text-[#1a1a1a]">
                      Import tips
                    </p>
                    <p>
                      Required columns: <strong>title</strong> and{" "}
                      <strong>category</strong> (slug, e.g. &quot;vehicles&quot;, &quot;property&quot;).
                      Column headers are auto-matched — no need for exact names.
                    </p>
                    <p>
                      <strong>Image URLs</strong>: Add an &quot;image_url&quot; column with direct links to images.
                      They&apos;ll be downloaded and attached to each listing automatically.
                    </p>
                    <p>
                      All imported listings start as <strong>drafts</strong> — activate them from your inventory after review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Phase: Column Mapping ─────────────────────────────────── */}
          {phase === "mapping" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shuffle className="w-4 h-4 text-[#8E7A6B]" />
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">
                    Map Your Columns
                  </h3>
                </div>
                <p className="text-xs text-[#8a8280]">
                  We auto-matched what we could. Review and adjust the mapping below. Columns mapped to &quot;Skip&quot; will be ignored.
                </p>
              </div>

              {!hasRequiredMapped && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please map at least <strong>Title</strong> and <strong>Category</strong> to continue.
                </div>
              )}

              <div className="border border-[#e8e6e3] divide-y divide-[#f0eeeb]">
                {rawHeaders.map((rawH) => {
                  const mapped = columnMapping[rawH] || "";
                  const sampleValues = rawRows
                    .slice(0, 3)
                    .map((r) => r[rawH])
                    .filter(Boolean);

                  return (
                    <div
                      key={rawH}
                      className="flex items-center gap-4 px-4 py-3"
                    >
                      <div className="w-1/3 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {rawH}
                        </p>
                        {sampleValues.length > 0 && (
                          <p className="text-[10px] text-[#8a8280] truncate mt-0.5">
                            e.g. {sampleValues.join(", ")}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8a8280] shrink-0" />
                      <div className="w-1/3">
                        <select
                          className="w-full px-3 py-2 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm bg-white"
                          value={mapped}
                          onChange={(e) => {
                            const val = e.target.value;
                            setColumnMapping((prev) => {
                              const next = { ...prev };
                              // Remove any other header mapping to the same canonical
                              if (val) {
                                for (const key of Object.keys(next)) {
                                  if (next[key] === val) delete next[key];
                                }
                              }
                              if (val) {
                                next[rawH] = val;
                              } else {
                                delete next[rawH];
                              }
                              return next;
                            });
                          }}
                        >
                          <option value="">— Skip —</option>
                          {getContextColumns(shopType).map((col) => (
                            <option key={col.key} value={col.key}>
                              {col.label}
                              {col.required ? " *" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-16 flex justify-center">
                        {mapped ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="text-[10px] text-[#8a8280]">
                            Skipped
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-[#8a8280] text-center">
                {mappedCount} of {rawHeaders.length} columns mapped
              </p>
            </div>
          )}

          {/* ── Phase: Preview ────────────────────────────────────────── */}
          {phase === "preview" && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-[#1a1a1a]">
                    <span className="font-semibold">{fileName}</span>
                    {" — "}
                    {validatedRows.length} rows parsed
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validCount} valid
                    </span>
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-3.5 h-3.5" />
                        {errorCount} with errors
                      </span>
                    )}
                    {imageRowCount > 0 && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {imageRowCount} with images
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rowsMissingDescription.length > 0 && (
                    <button
                      onClick={handleAiEnhance}
                      disabled={aiEnhancing}
                      className="text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657] transition-colors flex items-center gap-1.5 bg-[#8E7A6B]/5 px-3 py-1.5 border border-[#8E7A6B]/20"
                    >
                      {aiEnhancing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Writing descriptions ({aiEnhancedCount}/{rowsMissingDescription.length})
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          AI Describe ({rowsMissingDescription.length} rows)
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setPhase("mapping")}
                    className="text-xs text-[#8E7A6B] hover:text-[#7A6657] transition-colors flex items-center gap-1"
                  >
                    <Shuffle className="w-3 h-3" />
                    Edit mapping
                  </button>
                  <button
                    onClick={() => {
                      setPhase("upload");
                      setValidatedRows([]);
                      setRawHeaders([]);
                      setRawRows([]);
                      setColumnMapping({});
                      setFileName("");
                    }}
                    className="text-xs text-[#8a8280] hover:text-[#1a1a1a] transition-colors"
                  >
                    Upload different file
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-[#e8e6e3] overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#faf9f7] border-b border-[#e8e6e3]">
                      <th className="px-3 py-2 text-left font-medium text-[#8a8280] w-10">
                        #
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-[#8a8280] w-14">
                        Status
                      </th>
                      {Object.values(columnMapping).slice(0, 7).map((key) => {
                        const col = ALL_COLUMNS.find((c) => c.key === key);
                        return (
                          <th
                            key={key}
                            className="px-3 py-2 text-left font-medium text-[#6b6560] max-w-[150px]"
                          >
                            {col?.label ?? key}
                          </th>
                        );
                      })}
                      {Object.values(columnMapping).length > 7 && (
                        <th className="px-3 py-2 text-left font-medium text-[#8a8280]">
                          +{Object.values(columnMapping).length - 7} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eeeb]">
                    {validatedRows.slice(0, 50).map((row) => (
                      <tr
                        key={row.index}
                        className={
                          row.valid
                            ? "hover:bg-[#faf9f7]/50"
                            : "bg-red-50/30"
                        }
                      >
                        <td className="px-3 py-2 text-[#8a8280]">
                          {row.index + 1}
                        </td>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span
                              className="text-red-600 cursor-help"
                              title={row.errors.join("; ")}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                        {Object.values(columnMapping).slice(0, 7).map((key) => (
                          <td
                            key={key}
                            className="px-3 py-2 text-[#1a1a1a] max-w-[150px] truncate"
                          >
                            {key === "image_url" && row.data[key] ? (
                              <span className="inline-flex items-center gap-1 text-blue-600">
                                <ImageIcon className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">
                                  {row.data[key]}
                                </span>
                              </span>
                            ) : (
                              row.data[key] || (
                                <span className="text-[#ccc]">—</span>
                              )
                            )}
                          </td>
                        ))}
                        {Object.values(columnMapping).length > 7 && (
                          <td className="px-3 py-2 text-[#8a8280]">
                            ...
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validatedRows.length > 50 && (
                  <div className="px-3 py-2 text-xs text-[#8a8280] bg-[#faf9f7] border-t border-[#e8e6e3]">
                    Showing first 50 of {validatedRows.length} rows
                  </div>
                )}
              </div>

              {/* Error details */}
              {errorCount > 0 && (
                <div className="bg-red-50 border border-red-100 p-3">
                  <p className="text-xs font-medium text-red-700 mb-2">
                    {errorCount} row{errorCount > 1 ? "s" : ""} with errors (will be skipped):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validatedRows
                      .filter((r) => !r.valid)
                      .slice(0, 20)
                      .map((r) => (
                        <p key={r.index} className="text-xs text-red-600">
                          Row {r.index + 1}: {r.errors.join("; ")}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Phase: Importing ──────────────────────────────────────── */}
          {phase === "importing" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#8E7A6B] animate-spin mb-4" />
              <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                Creating {validCount} listings...
              </p>
              <p className="text-xs text-[#8a8280] mb-6">
                {imageRowCount > 0
                  ? "Importing data and downloading images. This may take a moment."
                  : "This may take a moment. Please don\u2019t close this window."}
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-sm">
                <div className="h-1.5 bg-[#f0eeeb] overflow-hidden">
                  <div
                    className="h-full bg-[#8E7A6B] transition-all duration-300 ease-out"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8a8280] text-center mt-2">
                  {importProgress}%
                </p>
              </div>
            </div>
          )}

          {/* ── Phase: Results ────────────────────────────────────────── */}
          {phase === "results" && importSummary && (
            <div className="space-y-5">
              {/* Summary */}
              <div
                className={`p-5 ${importSummary.created > 0 ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {importSummary.created > 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <h3 className="text-lg font-semibold text-[#1a1a1a]">
                    Import Complete
                  </h3>
                </div>
                <p className="text-sm text-[#6b6560]">
                  <span className="font-semibold text-emerald-700">
                    {importSummary.created} created
                  </span>
                  {importSummary.errors > 0 && (
                    <>
                      {" · "}
                      <span className="font-semibold text-red-600">
                        {importSummary.errors} failed
                      </span>
                    </>
                  )}
                  {" · "}
                  {importSummary.total} total
                </p>
                {importSummary.created > 0 && (
                  <p className="text-xs text-[#8a8280] mt-2">
                    All imported listings are saved as <strong>drafts</strong>. Use &quot;Activate All Drafts&quot; in your inventory to make them live.
                  </p>
                )}
              </div>

              {/* Result details */}
              <div className="border border-[#e8e6e3] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#faf9f7] border-b border-[#e8e6e3]">
                      <th className="px-3 py-2 text-left font-medium text-[#8a8280] w-10">
                        Row
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b6560]">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b6560] w-20">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b6560]">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eeeb]">
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.status === "created" ? "" : "bg-red-50/30"
                        }
                      >
                        <td className="px-3 py-2 text-[#8a8280]">
                          {r.row}
                        </td>
                        <td className="px-3 py-2 text-[#1a1a1a] font-medium truncate max-w-[200px]">
                          {r.title}
                        </td>
                        <td className="px-3 py-2">
                          {r.status === "created" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <Check className="w-3 h-3" /> Created
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <XCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#8a8280]">
                          {r.status === "created"
                            ? r.slug ?? ""
                            : r.error ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#e8e6e3] bg-[#faf9f7]">
          <button
            onClick={onClose}
            className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors"
          >
            {phase === "results" ? "Close" : "Cancel"}
          </button>

          {phase === "mapping" && (
            <button
              onClick={confirmMapping}
              disabled={!hasRequiredMapped}
              className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#7A6657] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#8E7A6B]/15"
            >
              Continue to Preview
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {phase === "preview" && (
            <button
              onClick={handleImport}
              disabled={validCount === 0}
              className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#7A6657] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#8E7A6B]/15"
            >
              <Upload className="w-4 h-4" />
              Import {validCount} Listing{validCount !== 1 ? "s" : ""}
            </button>
          )}

          {phase === "results" && importSummary && importSummary.created > 0 && (
            <button
              onClick={() => {
                onClose();
                router.refresh();
              }}
              className="inline-flex items-center gap-2 bg-[#8E7A6B] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#7A6657] transition-colors shadow-sm shadow-[#8E7A6B]/15"
            >
              <Check className="w-4 h-4" />
              Done — View Inventory
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
