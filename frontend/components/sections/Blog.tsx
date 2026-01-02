import React from "react";
import Link from "next/link";

export const Blog = () => {
    const posts = [
        {
            title: "Next.js에 Algolia 검색 통합하기",
            date: "2024년 12월 12일",
            excerpt: "Algolia를 사용하여 Next.js 애플리케이션에 강력한 검색 기능을 추가하는 단계별 가이드.",
            url: "/blog/algolia-nextjs",
        },
        {
            title: "Tailwind CSS로 디자인 시스템 구축하기",
            date: "2024년 11월 28일",
            excerpt: "확장 가능하고 유지 관리가 쉬운 디자인 시스템을 위해 Tailwind 구성을 구조화하는 방법.",
            url: "/blog/design-system-tailwind",
        },
    ];

    return (
        <section id="blog">
            <h2 className="numbered-heading">최근 게시물</h2>
            <div className="space-y-8">
                {posts.map((post, i) => (
                    <div key={i} className="group relative border-b border-lightest-navy pb-8 last:border-0">
                        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8">
                            <span className="font-mono text-green text-sm flex-shrink-0">
                                {post.date}
                            </span>
                            <div className="flex-1">
                                <h3 className="text-2xl text-lightest-slate group-hover:text-green transition-colors mb-2">
                                    <Link href={post.url} className="after:absolute after:inset-0">
                                        {post.title}
                                    </Link>
                                </h3>
                                <p className="text-slate text-base leading-relaxed">
                                    {post.excerpt}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-12">
                <Link
                    href="/blog"
                    className="font-mono text-green hover:underline decoration-green underline-offset-4"
                >
                    아카이브 보기 →
                </Link>
            </div>
        </section>
    );
};
