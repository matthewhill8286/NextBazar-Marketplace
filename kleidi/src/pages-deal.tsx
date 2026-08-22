import { useState } from "react";
import { Link, useParams } from "react-router";
import type { ItemStatus } from "../types";
import {
  COPY,
  DEED_LABEL,
  formatEur,
  STATUS_LABEL,
  TYPE_LABEL,
} from "./data";
import { useStore } from "./store";
import { DealNav, Field, inputClass, Pill } from "./ui";

const TONE: Record<ItemStatus, "mute" | "ok" | "warn" | "bad" | "brass"> = {
  todo: "mute",
  in_review: "brass",
  done: "ok",
  blocked: "bad",
  na: "mute",
};

export function DealPage() {
  const { id = "" } = useParams();
  const { locale, role, getDeal, cycleItem, setItemNote, inviteLawyer } =
    useStore();
  const t = locale === "el" ? COPY.el : COPY.en;
  const deal = getDeal(id);
  const [invite, setInvite] = useState("");
  const lang = locale === "el" ? "el" : "en";

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

  if (deal.status === "draft") {
    return (
      <p className="text-mute">
        {locale === "el" ? "Ο φάκελος δεν έχει ξεκλειδωθεί." : "This file is not unlocked yet."}{" "}
        <Link to={`/pay/${deal.id}`} className="text-brass">
          {t.payTitle}
        </Link>
      </p>
    );
  }

  const counts = deal.items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { todo: 0, in_review: 0, done: 0, blocked: 0, na: 0 } as Record<
      ItemStatus,
      number
    >,
  );
  const funds = deal.items.find((i) => i.key === "funds");
  const deposit = deal.items.find((i) => i.key === "deposited_contract");
  const lawyer = deal.members.find((m) => m.role === "lawyer");
  const buyer = deal.members.find((m) => m.role === "buyer");

  const deedCopy =
    deal.deedStatus === "trapped"
      ? t.trapped
      : deal.deedStatus === "pending"
        ? t.pendingDeed
        : deal.deedStatus === "issued"
          ? t.issuedDeed
          : t.unknownDeed;

  return (
    <div>
      <DealNav id={deal.id} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brass">
            {deal.city} · {TYPE_LABEL[deal.propertyType][lang]}
          </p>
          <h1 className="mt-1 font-serif text-4xl tracking-tight">
            {deal.locality || deal.city}
            {deal.addressLine ? (
              <span className="text-mute"> · {deal.addressLine}</span>
            ) : null}
          </h1>
          <p className="mt-2 text-mute">
            {formatEur(deal.askingPriceEur)}
            {deal.developerName ? ` · ${deal.developerName}` : ""}
            {deal.plotOrRegNo ? ` · ${deal.plotOrRegNo}` : ""}
          </p>
        </div>
        <Pill
          tone={
            deal.deedStatus === "trapped"
              ? "bad"
              : deal.deedStatus === "issued"
                ? "ok"
                : "warn"
          }
        >
          {t.deed}: {DEED_LABEL[deal.deedStatus][lang]}
        </Pill>
      </div>

      <div
        className={`mt-6 rounded-xl border p-4 text-sm leading-relaxed ${
          deal.deedStatus === "trapped"
            ? "border-bad/40 bg-bad/10 text-ink"
            : "border-line bg-panel text-mute"
        }`}
      >
        {deedCopy}
      </div>

      {funds && funds.status !== "done" && funds.status !== "na" ? (
        <p className="mt-3 text-sm text-warn">{t.moneyWarn}</p>
      ) : null}
      {deposit && deposit.status !== "done" && deposit.status !== "na" ? (
        <p className="mt-2 text-sm text-warn">{t.depositWarn}</p>
      ) : null}

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-sm text-mute">
          <span>{t.progress}</span>
          <span>
            {counts.done} done · {counts.in_review} review · {counts.blocked}{" "}
            blocked · {counts.todo} todo
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-panel-2">
          <Bar n={counts.done} className="bg-ok" />
          <Bar n={counts.in_review} className="bg-brass" />
          <Bar n={counts.blocked} className="bg-bad" />
          <Bar n={counts.todo} className="bg-line" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-3 text-xs text-mute">{t.cycleHint}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
            {deal.items.map((item) => (
              <li key={item.key} className="p-4">
                <button
                  type="button"
                  onClick={() => cycleItem(deal.id, item.key)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block font-medium">
                      {item.label[lang]}
                    </span>
                    <span className="mt-0.5 block text-sm text-mute">
                      {item.help[lang]}
                    </span>
                  </span>
                  <Pill tone={TONE[item.status]}>
                    {STATUS_LABEL[item.status][lang]}
                  </Pill>
                </button>
                {role === "lawyer" || item.note ? (
                  <textarea
                    className={`${inputClass} mt-3 min-h-[4.5rem] text-sm`}
                    value={item.note}
                    placeholder={
                      locale === "el" ? "Σημείωση φακέλου…" : "File note…"
                    }
                    onChange={(e) =>
                      setItemNote(deal.id, item.key, e.target.value)
                    }
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-panel p-5">
          <h2 className="font-serif text-xl">{t.parties}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <span className="text-mute">{t.buyer}</span>
              <div>{buyer?.name ?? "—"}</div>
            </li>
            <li>
              <span className="text-mute">{t.lawyer}</span>
              <div>
                {lawyer ? (
                  <>
                    {lawyer.name}
                    {lawyer.city ? (
                      <span className="text-mute"> · {lawyer.city}</span>
                    ) : null}
                    <div className="mt-1 text-xs text-mute">
                      {locale === "el"
                        ? "Άλλη επαρχία από το ακίνητο — λιγότερα «ξαδέρφια»."
                        : "Different district from the plot — fewer cousins."}
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </li>
          </ul>
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              inviteLawyer(deal.id, invite);
              setInvite("");
            }}
          >
            <Field label={t.inviteLawyer}>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={invite}
                  placeholder={t.invitePlaceholder}
                  onChange={(e) => setInvite(e.target.value)}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-brass px-3 text-sm text-brass"
                >
                  {t.add}
                </button>
              </div>
            </Field>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Bar({ n, className }: { n: number; className: string }) {
  if (n === 0) return null;
  return (
    <div className={className} style={{ width: `${(n / 8) * 100}%` }} />
  );
}
