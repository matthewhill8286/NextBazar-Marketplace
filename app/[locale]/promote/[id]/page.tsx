import PromoteClient from "./promote-client";

export default async function PromotePage(
  props: PageProps<"/[locale]/promote/[id]">,
) {
  const { id } = await props.params;
  return <PromoteClient listingId={id} />;
}
