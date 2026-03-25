import { getClientPricing } from "@/lib/stripe";
import PromoteClient from "./promote-client";

export default async function PromotePage(
  props: PageProps<"/[locale]/promote/[id]">,
) {
  const { id } = await props.params;
  const pricing = await getClientPricing();
  return <PromoteClient listingId={id} pricing={pricing} />;
}
