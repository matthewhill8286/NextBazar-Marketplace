import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/shop-analytics";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale("/dashboard/analytics", params.locale!));
}
export default function Redirect() { return null; }
