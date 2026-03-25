import type { Metadata } from "next";
import { getClientPricing } from "@/lib/stripe";
import PostClient from "./post-client";

export const metadata: Metadata = {
  title: "Post a Listing — NextBazar",
  description: "Create a new listing and start selling on NextBazar.",
};

export default async function PostPage() {
  const pricing = await getClientPricing();
  return <PostClient pricing={pricing} />;
}
