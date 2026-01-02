'use client'

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen, CheckCircle2 } from "lucide-react";
import { getBookList, BookResponse } from "@/lib/api";
import { ReadingBookCard } from "@/components/books/ReadingBookCard";

export const Reading = () => {
    const [readingBooks, setReadingBooks] = useState<BookResponse[]>([])
    const [completedBooks, setCompletedBooks] = useState<BookResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchBooks = async () => {
            setIsLoading(true)
            try {
                // Fetch reading books
                const readingRes = await getBookList(1, 3, 'reading')
                setReadingBooks(readingRes.items)

                // Fetch recently completed books
                const completedRes = await getBookList(1, 3, 'completed')
                setCompletedBooks(completedRes.items)
            } catch (err) {
                console.error('독서 섹션 데이터 가져오기 실패:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchBooks()
    }, [])

    if (!isLoading && readingBooks.length === 0 && completedBooks.length === 0) {
        return null
    }

    return (
        <section
            id="reading"
            className="mb-16 scroll-mt-20 md:mb-24 md:scroll-mt-24 lg:mb-36 lg:scroll-mt-[96px]"
            aria-label="독서 기록"
        >
            <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-navy/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:hidden">
                <h2 className="text-sm font-bold uppercase tracking-widest text-lightest-slate">
                    독서 기록
                </h2>
            </div>

            <div>
                {/* Reading Now Section */}
                {readingBooks.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest text-lightest-slate">
                            <BookOpen size={14} className="text-green" />
                            <span>Reading Now</span>
                        </div>
                        <ol className="group/list">
                            {readingBooks.map((book) => (
                                <li key={book.id} className="mb-12">
                                    <ReadingBookCard book={book} />
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Recently Completed Section */}
                {completedBooks.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest text-lightest-slate">
                            <CheckCircle2 size={14} className="text-green" />
                            <span>Recently Completed</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {completedBooks.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/books/${book.slug}`}
                                    className="group flex flex-col gap-2 p-3 rounded-lg border border-slate/10 hover:border-green/30 hover:bg-light-navy/30 transition-all"
                                >
                                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-light-navy">
                                        {book.cover_image ? (
                                            <Image
                                                src={book.cover_image}
                                                alt={book.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate/50 italic px-2 text-center">
                                                {book.title}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-medium text-slate/80 group-hover:text-green line-clamp-1">
                                        {book.title}
                                    </h4>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-12">
                    <Link
                        className="inline-flex items-baseline font-medium leading-tight text-lightest-slate hover:text-green focus-visible:text-green group/link text-base"
                        href="/books"
                        aria-label="모든 독서 노트 보기"
                    >
                        <span>
                            모든{" "}
                            <span className="inline-block">
                                독서 노트 보기
                                <ArrowUpRight className="inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none ml-1 translate-y-px" />
                            </span>
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
};
