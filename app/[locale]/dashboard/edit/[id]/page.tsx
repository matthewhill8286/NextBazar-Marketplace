import EditWrapper from "../../edit/[id]/edit-wrapper";

export default async function DashboardEditPage(
  props: PageProps<"/[locale]/dashboard/edit/[id]">,
) {
  const { id } = await props.params;
  return <EditWrapper listingId={id} backHref="/dashboard/inventory" />;
}
