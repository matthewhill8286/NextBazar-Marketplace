import { Link } from "react-router";
import { COPY, SAMPLE_DEAL_ID } from "./data";
import { useStore } from "./store";
import { btnClass, ghostBtn } from "./ui";

export function HomePage() {
  const { locale, deals } = useStore();
  const t = locale === "el" ? COPY.el : COPY.en;
  const others = deals.filter((d) => d.id !== SAMPLE_DEAL_ID);

  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brass">Cyprus · CY</p>
      <h1 className="font-serif text-5xl leading-[1.1] tracking-tight">
        {t.tagline}
      </h1>
      <p className="mt-5 max-w-lg text-lg text-mute">{t.notAMarket}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/start" className={btnClass}>
          {t.startFile}
        </Link>
        <Link to={`/deal/${SAMPLE_DEAL_ID}`} className={ghostBtn}>
          {t.openSample}
        </Link>
      </div>
      <p className="mt-8 text-sm text-mute">{t.demoNote}</p>

      {others.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-3 font-serif text-xl">Your files</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
            {others.map((d) => (
              <li key={d.id}>
                <Link
                  to={d.status === "draft" ? `/pay/${d.id}` : `/deal/${d.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-ink no-underline hover:bg-panel-2"
                >
                  <span>
                    {d.locality || d.city}
                    <span className="ml-2 text-sm text-mute">{d.developerName}</span>
                  </span>
                  <span className="text-sm text-mute">{d.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        <aside className="rounded-xl border border-line bg-panel p-5">
          <h3 className="font-serif text-lg">{t.buyer}</h3>
          <p className="mt-2 text-sm text-mute">
            {locale === "el"
              ? "Πληρώνετε €490. Μοιράζεστε τον σύνδεσμο με τον δικηγόρο σας — όχι του εργολάβου."
              : "Pay €490. Share the link with your lawyer — not the developer’s."}
          </p>
        </aside>
        <aside className="rounded-xl border border-line bg-panel p-5">
          <h3 className="font-serif text-lg">{t.lawyer}</h3>
          <p className="mt-2 text-sm text-mute">
            {locale === "el"
              ? "Δωρεάν θέση. Τσεκάρετε τη λίστα, ανεβάστε τα PDF του Κτηματολογίου. Ο πελάτης σας κάλεσε."
              : "Free seat. Tick the list, attach Land Registry PDFs. The client invited you."}
          </p>
        </aside>
      </div>
    </div>
  );
}
