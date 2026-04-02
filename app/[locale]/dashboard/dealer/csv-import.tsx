"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useReferenceData } from "@/lib/hooks/use-reference-data";

// ─── CSV column definitions ─────────────────────────────────────────────────

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
  // Property attributes
  { key: "property_type", label: "Property Type", required: false },
  { key: "bedrooms", label: "Bedrooms", required: false },
  { key: "bathrooms", label: "Bathrooms", required: false },
  { key: "area_sqm", label: "Area (m²)", required: false },
  { key: "furnishing", label: "Furnishing", required: false },
] as const;

const VEHICLE_ATTR_KEYS = [
  "make",
  "model",
  "year",
  "mileage",
  "fuel_type",
  "transmission",
  "body_type",
  "color",
  "engine_size",
  "doors",
  "drive_type",
];

const PROPERTY_ATTR_KEYS = [
  "property_type",
  "bedrooms",
  "bathrooms",
  "area_sqm",
  "furnishing",
];

const ALL_ATTR_KEYS = [...VEHICLE_ATTR_KEYS, ...PROPERTY_ATTR_KEYS];

// ─── Types ──────────────────────────────────────────────────────────────────

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

type Phase = "upload" | "preview" | "importing" | "results";

// ─── CSV Parsing ────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header row
  const headers = parseLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_"),
  );

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    // Skip completely empty rows
    if (Object.values(row).some((v) => v.length > 0)) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

/** Parse a single CSV line, respecting quoted fields */
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

// ─── Template generation ────────────────────────────────────────────────────

function generateTemplate(type: "vehicles" | "properties" | "general"): string {
  const base = ["title", "description", "price", "price_type", "condition", "category", "subcategory", "location", "contact_phone"];

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

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  onClose: () => void;
};

export default function CSVImport({ onClose }: Props) {
  const router = useRouter();
  const { categories, subcategories, locations, loading: refLoading } = useReferenceData();

  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    created: number;
    errors: number;
  } | null>(null);

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

  // ─── Validate a parsed row ───────────────────────────────────────────
  const validateRow = useCallback(
    (data: ParsedRow, index: number): ValidatedRow => {
      const errors: string[] = [];

      if (!data.title || data.title.trim().length < 3) {
        errors.push("Title required (min 3 chars)");
      }

      if (!data.category || !validCategories.has(data.category.toLowerCase())) {
        errors.push(
          `Invalid category "${data.category || "(empty)"}"`,
        );
      }

      if (
        data.subcategory &&
        !validSubcategories.has(data.subcategory.toLowerCase())
      ) {
        errors.push(`Unknown subcategory "${data.subcategory}"`);
      }

      if (
        data.location &&
        !validLocations.has(data.location.toLowerCase())
      ) {
        errors.push(`Unknown location "${data.location}"`);
      }

      if (data.price && isNaN(Number(data.price))) {
        errors.push("Price must be a number");
      }

      return { index, data, errors, valid: errors.length === 0 };
    },
    [validCategories, validSubcategories, validLocations],
  );

  // ─── Handle file selection ────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers: h, rows } = parseCSV(text);

        if (h.length === 0 || rows.length === 0) {
          return;
        }

        setHeaders(h);
        const validated = rows.map((row, i) => validateRow(row, i));
        setValidatedRows(validated);
        setPhase("preview");
      };
      reader.readAsText(file);
    },
    [validateRow],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  // ─── Import ───────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    const validRows = validatedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setPhase("importing");

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
        attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
      };
    });

    try {
      const res = await fetch("/api/dealer/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });

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

  // ─── Stats ────────────────────────────────────────────────────────────
  const validCount = validatedRows.filter((r) => r.valid).length;
  const errorCount = validatedRows.filter((r) => !r.valid).length;

  // ─── Render ───────────────────────────────────────────────────────────
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
                Import Listings from CSV
              </h2>
              <p className="text-xs text-[#8a8280]">
                Bulk-create listings from a spreadsheet file
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Phase: Upload ─────────────────────────────────────────── */}
          {phase === "upload" && (
            <div className="space-y-6">
              {/* Template downloads */}
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-3">
                  1. Download a template
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { type: "vehicles" as const, label: "Vehicles" },
                      { type: "properties" as const, label: "Properties" },
                      { type: "general" as const, label: "General" },
                    ] as const
                  ).map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => downloadTemplate(type)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#faf9f7] text-[#666] border border-[#e8e6e3] hover:bg-[#f0eeeb] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {label} Template
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-3">
                  2. Upload your CSV file
                </p>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#e8e6e3] hover:border-[#8E7A6B] p-12 text-center cursor-pointer transition-colors group"
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-[#8a8280] group-hover:text-[#8E7A6B] transition-colors" />
                  <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                    Drop your CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-[#8a8280]">
                    Supports .csv files up to 200 listings
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
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
                      <strong>category</strong> (slug, e.g.
                      &quot;vehicles&quot;, &quot;property&quot;).
                    </p>
                    <p>
                      Locations accept city names or slugs (e.g.
                      &quot;Limassol&quot; or &quot;limassol&quot;).
                    </p>
                    <p>
                      All imported listings start as{" "}
                      <strong>drafts</strong> — activate them from
                      your inventory after review.
                    </p>
                    <p>
                      Vehicle and property attributes (make, model,
                      bedrooms, etc.) are automatically mapped when
                      matching column headers are found.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Phase: Preview ────────────────────────────────────────── */}
          {phase === "preview" && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-[#1a1a1a]">
                    <span className="font-semibold">{fileName}</span>{" "}
                    &mdash; {validatedRows.length} rows parsed
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
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPhase("upload");
                    setValidatedRows([]);
                    setHeaders([]);
                    setFileName("");
                  }}
                  className="text-xs text-[#8a8280] hover:text-[#1a1a1a] transition-colors"
                >
                  Upload different file
                </button>
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
                      {headers.slice(0, 7).map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-medium text-[#6b6560] max-w-[150px]"
                        >
                          {h.replace(/_/g, " ")}
                        </th>
                      ))}
                      {headers.length > 7 && (
                        <th className="px-3 py-2 text-left font-medium text-[#8a8280]">
                          +{headers.length - 7} more
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
                        {headers.slice(0, 7).map((h) => (
                          <td
                            key={h}
                            className="px-3 py-2 text-[#1a1a1a] max-w-[150px] truncate"
                          >
                            {row.data[h] || (
                              <span className="text-[#ccc]">—</span>
                            )}
                          </td>
                        ))}
                        {headers.length > 7 && (
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
                    {errorCount} row{errorCount > 1 ? "s" : ""} with
                    errors (will be skipped):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validatedRows
                      .filter((r) => !r.valid)
                      .slice(0, 20)
                      .map((r) => (
                        <p
                          key={r.index}
                          className="text-xs text-red-600"
                        >
                          Row {r.index + 1}:{" "}
                          {r.errors.join("; ")}
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
              <p className="text-xs text-[#8a8280]">
                This may take a moment. Please don&apos;t close this
                window.
              </p>
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
                    All imported listings are saved as{" "}
                    <strong>drafts</strong>. Use &quot;Activate All
                    Drafts&quot; in your inventory to make them live.
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
                          r.status === "created"
                            ? ""
                            : "bg-red-50/30"
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
