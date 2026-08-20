import BlogPostPage from "@/app/[locale]/blog/[slug]/page";
import { getPostBySlug } from "@/lib/blog";
import type { Route } from "./+types/blog-slug";

export async function loader({ params }: Route.LoaderArgs) {
  const post = getPostBySlug(params.slug!);
  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

export function meta({ data }: Route.MetaArgs) {
  const post = data?.post;
  if (!post) return [{ title: "Post Not Found" }];
  return [
    { title: post.title },
    { name: "description", content: post.description },
  ];
}

export default function BlogSlug({ loaderData }: Route.ComponentProps) {
  return <BlogPostPage post={loaderData.post} />;
}
