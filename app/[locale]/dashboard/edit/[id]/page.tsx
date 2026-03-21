import EditWrapper from "./edit-wrapper";

export default async function EditListingPage(
  props: PageProps<"/[locale]/dashboard/edit/[id]">,
) {
  const { id } = await props.params;
  return <EditWrapper listingId={id} />;
}
