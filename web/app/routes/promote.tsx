import PromoteClient from "@/app/[locale]/promote/[id]/promote-client";
import { requireUser } from "../auth.server";
import { getClientPricing } from "@/lib/stripe";
import type { Route } from "./+types/promote";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request, params.locale!);
  const pricing = await getClientPricing();
  return { listingId: params.id!, pricing };
}

export default function PromotePage({ loaderData }: Route.ComponentProps) {
  return <PromoteClient listingId={loaderData.listingId} pricing={loaderData.pricing} />;
}
