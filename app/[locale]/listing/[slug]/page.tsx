import ListingDetail from "./listing-detail";

export default async function ListingPage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  const { slug } = await props.params;
  return <ListingDetail slug={slug} />;
}
