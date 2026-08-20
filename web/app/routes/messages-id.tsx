import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import type { Route } from "./+types/messages-id";

export function loader({ params }: Route.LoaderArgs) {
  throw redirect(withLocale(`/dashboard/messages/${params.id}`, params.locale!));
}

export default function ChatRedirect() {
  return null;
}
