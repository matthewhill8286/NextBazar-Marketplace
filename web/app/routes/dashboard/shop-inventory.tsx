import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/shop-inventory";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale("/dashboard/inventory", params.locale!));
}
export default function Redirect() { return null; }
