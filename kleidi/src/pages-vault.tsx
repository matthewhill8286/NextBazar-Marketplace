import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { COPY, formatBytes } from "./data";
import { useStore } from "./store";
import { DealNav, Field, inputClass } from "./ui";

export function VaultPage() {
  const { id = "" } = useParams();
  const { locale, getDeal, addDocument } = useStore();
  const t = locale === "el" ? COPY.el : COPY.en;
  const deal = getDeal(id);
  const lang = locale === "el" ? "el" : "en";
  const [title, setTitle] = useState("");
  const [key, setKey] = useState<string>("contract");

  if (!deal) {
    return (
      <p>
        {t.empty}{" "}
        <Link to="/" className="text-brass">
          {t.home}
        </Link>
      </p>
    );
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) return;
    addDocument(deal.id, {
      title: name.endsWith(".pdf") ? name : `${name}.pdf`,
      checklistKey: key || null,
      mimeType: "application/pdf",
      byteSize: 120_000,
    });
    setTitle("");
  }

  return (
    <div>
      <DealNav id={deal.id} />
      <h1 className="font-serif text-4xl">{t.vault}</h1>
      <p className="mt-2 text-mute">{t.vaultLead}</p>

      <form
        onSubmit={onAdd}
        className="mt-6 grid gap-3 rounded-xl border border-line bg-panel p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
      >
        <Field label={t.addDoc}>
          <input
            className={inputClass}
            value={title}
            placeholder="land-search-2026-08.pdf"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label={t.progress}>
          <select
            className={inputClass}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          >
            {deal.items.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label[lang]}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          className="rounded-full bg-brass px-4 py-2 text-sm text-paper"
        >
          {t.add}
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel-2 text-xs uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Tied to</th>
              <th className="px-4 py-3 font-medium">By</th>
              <th className="px-4 py-3 font-medium">Size</th>
            </tr>
          </thead>
          <tbody className="bg-panel">
            {deal.documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-mute">
                  —
                </td>
              </tr>
            ) : (
              deal.documents.map((doc) => {
                const item = deal.items.find((i) => i.key === doc.checklistKey);
                return (
                  <tr key={doc.id} className="border-t border-line">
                    <td className="px-4 py-3 font-medium">{doc.title}</td>
                    <td className="px-4 py-3 text-mute">
                      {item ? item.label[lang] : "—"}
                    </td>
                    <td className="px-4 py-3 text-mute">{doc.uploadedBy}</td>
                    <td className="px-4 py-3 text-mute">
                      {formatBytes(doc.byteSize)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
