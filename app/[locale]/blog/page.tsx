import { ArrowRight, Calendar, Tag, User } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getAllPosts } from "@/lib/blog";
import { buildAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog — Tips, Guides & Market Insights",
  description:
    "Buying guides, seller tips, market reports, and product updates from the NextBazar team.",
  alternates: buildAlternates("/blog"),
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">
          NextBazar Blog
        </h1>
        <p className="text-[#6b6560] text-lg max-w-xl mx-auto">
          Tips for buyers and sellers, market insights, and updates from the
          team.
        </p>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-[#faf9f7] border border-[#e8e6e3]">
          <p className="text-[#6b6560] text-sm mb-2">
            No posts yet — check back soon!
          </p>
          <p className="text-[#8a8280] text-xs">
            We&apos;re working on buying guides, seller tips, and market reports
            for Cyprus.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post, i) => (
            <article
              key={post.slug}
              className={`bg-white border border-[#e8e6e3] overflow-hidden ${
                i === 0 ? "shadow-sm" : ""
              }`}
            >
              {post.image && i === 0 && (
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${post.image})` }}
                />
              )}
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-[#8a8280] mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-[#8E7A6B] transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="text-[#6b6560] text-sm leading-relaxed mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3 text-[#8a8280]" />
                      <div className="flex gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-[#f0eeeb] text-[#6b6560] text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-[#8E7A6B] font-medium hover:text-[#7A6657] transition-colors"
                  >
                    Read more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
