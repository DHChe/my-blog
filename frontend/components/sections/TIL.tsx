'use client'

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TILCard } from "@/components/til/TILCard";
import { getPosts, type TILResponse } from "@/lib/api";

export const TIL = () => {
    const [posts, setPosts] = useState<TILResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const data = await getPosts(1, 3, undefined, true)
                setPosts(data.items)
                console.log('TIL 섹션 데이터:', data)
            } catch (err) {
                console.error('TIL 섹션 데이터 가져오기 실패:', err)
                setError(err instanceof Error ? err.message : 'TIL을 불러오는데 실패했습니다.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchPosts()
    }, [])

    return (
        <section
            id="til"
            className="mb-16 scroll-mt-20 md:mb-24 md:scroll-mt-24 lg:mb-36 lg:scroll-mt-[96px]"
            aria-label="오늘 배운 것"
        >
            <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-navy/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:hidden">
                <h2 className="text-sm font-bold uppercase tracking-widest text-lightest-slate">
                    오늘 배운 것
                </h2>
            </div>
            <div>
                {error ? (
                    <div className="text-red-400 text-sm">
                        <p>오류: {error}</p>
                        <p className="mt-2 text-slate/70">콘솔을 확인해주세요.</p>
                    </div>
                ) : isLoading ? (
                    <p className="text-slate">로딩 중...</p>
                ) : posts.length > 0 ? (
                    <ol className="group/list">
                        {posts.map((post: TILResponse) => (
                            <li
                                key={post.id}
                                className="mb-12"
                            >
                                <div className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                                    <div className="absolute -inset-x-4 -inset-y-4 z-0 rounded-md transition motion-reduce:transition-none md:-inset-x-6 opacity-0 group-hover:opacity-100 group-hover:bg-light-navy/50 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] group-hover:drop-shadow-lg"></div>
                                    <div className="relative z-10 sm:col-span-8">
                                        <TILCard
                                            title={post.title}
                                            date={post.published_at || post.created_at}
                                            excerpt={post.excerpt}
                                            tags={post.tags}
                                            slug={post.slug}
                                            dayNumber={post.day_number}
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-slate">아직 작성된 TIL이 없습니다.</p>
                )}
                <div className="mt-12">
                    <Link
                        className="inline-flex items-baseline font-medium leading-tight text-lightest-slate hover:text-green focus-visible:text-green group/link text-base"
                        href="/til"
                        aria-label="모든 TIL 보기"
                    >
                        <span>
                            모든{" "}
                            <span className="inline-block">
                                TIL 보기
                                <ArrowUpRight className="inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none ml-1 translate-y-px" />
                            </span>
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
};
