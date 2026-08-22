import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { COPY, type DealRecord } from "./data";
import { useStore } from "./store";
import { btnClass, Field, inputClass } from "./ui";

export function StartPage() {
  const { locale, createDraft } = useStore();
  const t = locale === "el" ? COPY.el : COPY.en;
  const nav = useNavigate();
  const [type, setType] = useState<DealRecord["propertyType"]>("off_plan");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = createDraft({
      country: "CY",
      city: String(fd.get("city") || "Paphos"),
      locality: String(fd.get("locality") || ""),
      addressLine: String(fd.get("address") || ""),
      plotOrRegNo: String(fd.get("plot") || ""),
      propertyType: type,
      askingPriceEur: Number(fd.get("price") || 0),
      developerName: String(fd.get("developer") || ""),
      buyerName: String(fd.get("buyer") || "You"),
    });
    nav(`/pay/${id}`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-4xl">{t.intakeTitle}</h1>
      <p className="mt-3 text-mute">{t.intakeLead}</p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <Field label={locale === "el" ? "Αγοραστής" : "Buyer name"}>
          <input name="buyer" className={inputClass} defaultValue="James Hart" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.city}>
            <input name="city" className={inputClass} defaultValue="Paphos" />
          </Field>
          <Field label={t.locality}>
            <input name="locality" className={inputClass} defaultValue="Peyia" />
          </Field>
        </div>
        <Field label={t.address}>
          <input
            name="address"
            className={inputClass}
            placeholder="Cap St. George, unit…"
          />
        </Field>
        <Field label={t.plot}>
          <input name="plot" className={inputClass} placeholder="Sheet 45, plot 218" />
        </Field>
        <Field label={t.type}>
          <select
            className={inputClass}
            value={type}
            onChange={(e) =>
              setType(e.target.value as DealRecord["propertyType"])
            }
          >
            <option value="off_plan">Off-plan</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="plot">Plot</option>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.price}>
            <input
              name="price"
              type="number"
              className={inputClass}
              defaultValue={890000}
            />
          </Field>
          <Field label={t.developer}>
            <input name="developer" className={inputClass} defaultValue="" />
          </Field>
        </div>
        <button type="submit" className={`${btnClass} mt-2 w-fit`}>
          {t.continue}
        </button>
      </form>
    </div>
  );
}
