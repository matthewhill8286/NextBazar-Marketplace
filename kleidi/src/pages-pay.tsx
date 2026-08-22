import { Link, useNavigate, useParams } from "react-router";
import { COPY, formatEur } from "./data";
import { useStore } from "./store";
import { btnClass, ghostBtn, Pill } from "./ui";

export function PayPage() {
  const { id = "" } = useParams();
  const { locale, getDeal, markPaid } = useStore();
  const t = locale === "el" ? COPY.el : COPY.en;
  const nav = useNavigate();
  const deal = getDeal(id);

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

  const locked = deal.status !== "draft";

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-4xl">{t.payTitle}</h1>
      <p className="mt-3 text-mute">{t.payLead}</p>
      <div className="mt-8 rounded-2xl border border-line bg-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-xl">
              {deal.locality || deal.city}
              {deal.addressLine ? ` · ${deal.addressLine}` : ""}
            </p>
            <p className="mt-1 text-sm text-mute">
              {deal.city}
              {deal.developerName ? ` · ${deal.developerName}` : ""}
            </p>
          </div>
          <Pill tone={locked ? "ok" : "warn"}>
            {locked ? t.paid : "requires_payment"}
          </Pill>
        </div>
        <p className="mt-6 font-serif text-3xl">€490</p>
        <p className="mt-1 text-sm text-mute">
          {formatEur(deal.askingPriceEur)}{" "}
          {locale === "el" ? "τιμή ακινήτου" : "asking — fee is per file, not a %"}
        </p>
        {locked ? (
          <Link to={`/deal/${deal.id}`} className={`${btnClass} mt-6`}>
            {t.workspace}
          </Link>
        ) : (
          <button
            type="button"
            className={`${btnClass} mt-6`}
            onClick={() => {
              markPaid(deal.id);
              nav(`/deal/${deal.id}`);
            }}
          >
            {t.payCta}
          </button>
        )}
      </div>
      <Link to="/" className={`${ghostBtn} mt-6`}>
        {t.home}
      </Link>
    </div>
  );
}
