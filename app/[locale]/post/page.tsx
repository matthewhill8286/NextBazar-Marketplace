import type { Metadata } from "next";
import PostClient from "./post-client";

export const metadata: Metadata = {
  title: "Post a Listing — NextBazar",
  description: "Create a new listing and start selling on NextBazar.",
};

export default function PostPage() {
  return <PostClient />;
}
