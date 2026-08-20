import EditWrapper from "@/app/[locale]/dashboard/edit/[id]/edit-wrapper";
import type { Route } from "./+types/edit";

export default function DashboardEditPage({ params }: Route.ComponentProps) {
  return <EditWrapper listingId={params.id!} backHref="/dashboard/inventory" />;
}
