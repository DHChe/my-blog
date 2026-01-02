import { getPostBySlug } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function TILDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const formattedDate = new Date(
        post.published_at || post.created_at
    ).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="w-full min-h-screen px-6 py-12 md:px-12 md:py-20 lg:px-24 lg:py-24">
            <div className="mx-auto max-w-5xl">
                {/* Back Navigation */}
                <Link
                    href="/til"
                    className="group mb-8 inline-flex items-center font-semibold leading-tight text-green hover:underline"
                >
                    <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span>목록으로</span>
                </Link>

                <article className="w-full">
                    {/* Header */}
                    <header className="mb-12">
                        {/* Meta info */}
                        <div className="mb-4 flex items-center gap-4 text-sm text-slate">
                            <span className="font-mono text-green">Day {post.day_number}</span>
                            <span className="text-slate/50">·</span>
                            <time dateTime={post.published_at || post.created_at}>
                                {formattedDate}
                            </time>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold tracking-tight text-lightest-slate sm:text-4xl lg:text-5xl">
                            {post.title}
                        </h1>

                        {/* Tags */}
                        <ul className="mt-6 flex flex-wrap gap-2" aria-label="태그">
                            {post.tags.map((tag) => (
                                <li key={tag.slug}>
                                    <span className="flex items-center rounded-full bg-green-tint px-3 py-1 text-xs font-medium leading-5 text-green">
                                        {tag.name}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* Excerpt */}
                        <p className="mt-6 text-lg leading-relaxed text-light-slate">
                            {post.excerpt}
                        </p>
                    </header>

                    {/* Content */}
                    <MarkdownRenderer content={post.content} className="text-slate" />

                    {/* Footer Navigation */}
                    <footer className="mt-16 pt-8 border-t border-lightest-navy">
                        <Link
                            href="/til"
                            className="group inline-flex items-center font-semibold leading-tight text-green hover:underline"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span>모든 TIL 보기</span>
                        </Link>
                    </footer>
                </article>
            </div>
        </div>
    );
}
