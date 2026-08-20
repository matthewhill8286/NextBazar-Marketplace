import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/listings";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale("/dashboard", params.locale!));
}
export default function Redirect() { return null; }
