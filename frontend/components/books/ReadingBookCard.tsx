'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookResponse } from '@/lib/api'

interface ReadingBookCardProps {
    book: BookResponse
}

export function ReadingBookCard({ book }: ReadingBookCardProps) {
    return (
        <Link
            href={`/books/${book.slug}`}
            className="group relative grid grid-cols-8 gap-4 pb-1 transition-all md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50"
        >
            <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none md:-inset-x-6 lg:block lg:group-hover:bg-light-navy/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"></div>

            {/* Cover Image */}
            <div className="relative z-10 sm:col-span-2 flex justify-start pt-1">
                <div className="relative aspect-[3/4] w-16 sm:w-24 overflow-hidden rounded border-2 border-slate/10 transition group-hover:border-slate/30">
                    {book.cover_image ? (
                        <Image
                            src={book.cover_image}
                            alt={book.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-light-navy text-[10px] text-slate/50 text-center px-1 italic">
                            {book.title}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 sm:col-span-6 flex flex-col">
                <h3 className="font-medium leading-tight text-lightest-slate group-hover:text-green focus-visible:text-green text-base">
                    <div>
                        <span className="absolute -inset-x-4 -inset-y-4 hidden rounded md:-inset-x-6 lg:block"></span>
                        <span>
                            {book.title}
                        </span>
                    </div>
                </h3>
                <p className="mt-1 text-sm font-medium leading-normal text-slate/70">
                    {book.author}
                </p>

                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate">
                        <span>Progress</span>
                        <span>{Math.round(book.progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate/10">
                        <div
                            className="h-full bg-green transition-all duration-1000 ease-out"
                            style={{ width: `${book.progress}%` }}
                        />
                    </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Book stats">
                    <li className="flex items-center rounded-full bg-green/10 px-3 py-1 text-xs font-medium leading-5 text-green">
                        {book.notes_count} Notes
                    </li>
                    <li className="flex items-center rounded-full bg-slate/10 px-3 py-1 text-xs font-medium leading-5 text-slate/70">
                        {book.total_chapters - book.notes_count} Chapters left
                    </li>
                </ul>
            </div>
        </Link>
    )
}
