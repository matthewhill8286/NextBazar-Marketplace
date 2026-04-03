"use client";

import { useEffect, useState } from "react";

type Props = {
  dateStr: string;
  locale: string;
  labels: { m: string; h: string; d: string };
};

function compute(dateStr: string, locale: string, labels: Props["labels"]) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return labels.m.replace("{n}", String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return labels.h.replace("{n}", String(hrs));
  const days = Math.floor(hrs / 24);
  if (days < 30) return labels.d.replace("{n}", String(days));
  const dateLocale =
    locale === "el" ? "el-GR" : locale === "ru" ? "ru-RU" : "en-GB";
  return new Date(dateStr).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Client component — uses Date.now() which is not allowed during prerendering. */
export default function TimeAgo({ dateStr, locale, labels }: Props) {
  const [text, setText] = useState(() => compute(dateStr, locale, labels));

  // Re-compute once on mount so SSR placeholder stays roughly correct
  useEffect(() => {
    setText(compute(dateStr, locale, labels));
  }, [dateStr, locale, labels]);

  return <>{text}</>;
}
