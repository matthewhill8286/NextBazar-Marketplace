import EditWrapper from "../../../dashboard/edit/[id]/edit-wrapper";

export default async function ShopManagerEditPage(
  props: PageProps<"/[locale]/shop-manager/edit/[id]">,
) {
  const { id } = await props.params;
  return <EditWrapper listingId={id} backHref="/shop-manager/inventory" />;
}
