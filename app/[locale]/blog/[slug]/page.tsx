import { ArrowLeft, Calendar, Tag, User } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { buildAlternates } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Post Not Found" };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: buildAlternates(`/blog/${slug}`),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.image && { images: [{ url: post.image }] }),
    },
  };
}

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Back */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#8E7A6B] font-medium hover:text-[#7A6657] transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Blog
      </Link>

      {/* Header */}
      <article>
        <header className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#8a8280]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Tag className="w-3.5 h-3.5 text-[#8a8280]" />
              <div className="flex gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-[#f0eeeb] text-[#6b6560] text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </header>

        {post.image && (
          <div
            className="w-full h-64 md:h-80 bg-cover bg-center mb-8"
            style={{ backgroundImage: `url(${post.image})` }}
          />
        )}

        {/* Body — rendered as simple HTML-ish markdown */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:text-[#1a1a1a] prose-headings:font-semibold
            prose-p:text-[#4a4a4a] prose-p:leading-relaxed
            prose-a:text-[#8E7A6B] prose-a:underline prose-a:underline-offset-2
            prose-strong:text-[#1a1a1a]
            prose-ul:text-[#4a4a4a] prose-ol:text-[#4a4a4a]
            prose-blockquote:border-[#8E7A6B] prose-blockquote:text-[#6b6560]"
          dangerouslySetInnerHTML={{
            __html: simpleMarkdown(post.content),
          }}
        />
      </article>

      {/* CTA */}
      <div className="mt-12 pt-8 border-t border-[#e8e6e3] text-center">
        <p className="text-[#6b6560] text-sm mb-4">
          Ready to buy or sell on Cyprus&apos;s smartest marketplace?
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors"
        >
          Browse Listings
        </Link>
      </div>
    </div>
  );
}

// Simple markdown → HTML (handles basics without pulling in a full MDX pipeline)
function simpleMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><h/g, "<h")
    .replace(/<\/h(\d)><\/p>/g, "</h$1>")
    .replace(/<p><ul>/g, "<ul>")
    .replace(/<\/ul><\/p>/g, "</ul>");
}
