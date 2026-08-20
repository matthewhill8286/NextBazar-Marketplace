import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/shop-messages";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale("/dashboard/messages", params.locale!));
}
export default function Redirect() { return null; }
