import { redirect } from "next/navigation";

/**
 * Legacy shop dashboard route — redirects to the standalone Shop Manager.
 */
export default function ShopPageRedirect() {
  redirect("/shop-manager");
}
