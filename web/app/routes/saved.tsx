import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/saved";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale("/dashboard/saved", params.locale!));
}

export default function SavedRedirect() {
  return null;
}
