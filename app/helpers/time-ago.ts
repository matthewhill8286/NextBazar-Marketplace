import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Returns the number of days since the given date string,
 * or a translated "minutes"/"hours" label if under 24h.
 * Defers Date.now() to the client to avoid prerender errors.
 */
export function useTimeAgoDays(
  dateStr: string,
  translationKey: string,
): string | number | null {
  const t = useTranslations(translationKey);
  const [result, setResult] = useState<string | number | null>(null);

  useEffect(() => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
      setResult(t("timeMinutes", { n: mins }));
      return;
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      setResult(t("timeHours", { n: hrs }));
      return;
    }
    setResult(Math.floor(hrs / 24));
  }, [dateStr, t]);

  return result;
}

/**
 * @deprecated Use useTimeAgoDays instead to avoid prerender Date.now() errors.
 */
export function timeAgoDays(
  dateStr: string,
  translationKey: string,
): string | number {
  const t = useTranslations(translationKey);
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("timeMinutes", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("timeHours", { n: hrs });
  return Math.floor(hrs / 24);
}
