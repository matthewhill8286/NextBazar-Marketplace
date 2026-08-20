import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/shop-branding";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale("/dashboard/branding", params.locale!));
}
export default function Redirect() { return null; }
