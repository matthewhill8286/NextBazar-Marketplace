import { redirect } from "next/navigation";

// My Listings has been merged into the Overview dashboard.
export default function MyListingsRedirect() {
  redirect("/dashboard");
}
