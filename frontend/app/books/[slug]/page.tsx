import { getBookBySlug } from '@/lib/api'
import { BookNoteCard } from '@/components/books/BookNoteCard'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Calendar, User, BookOpen } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface BookDetailPageProps {
    params: {
        slug: string
    }
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
    const book = await getBookBySlug(params.slug)
    if (!book) return { title: 'Book Not Found' }

    return {
        title: `${book.title} | 독서 노트`,
        description: `${book.author} 저 - ${book.title} 독서 노트와 요약입니다.`,
    }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
    const book = await getBookBySlug(params.slug)

    if (!book) {
        notFound()
    }

    const publishedNotes = book.notes.filter(n => n.is_published)

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <Link
                href="/books"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-12 group"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                도서 목록으로 돌아가기
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl shadow-black/50 mb-8">
                            {book.cover_image ? (
                                <Image
                                    src={book.cover_image}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 italic text-center p-8">
                                    {book.title}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-100 leading-tight">
                                    {book.title}
                                </h1>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <User size={16} className="text-emerald-500" />
                                    <span className="font-medium">{book.author}</span>
                                </div>
                            </div>

                            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 uppercase font-bold tracking-widest">진행 상황</span>
                                    <span className="text-emerald-500 font-bold">{Math.round(book.progress)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${book.progress}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">시작일</span>
                                        <span className="text-xs text-slate-300 font-medium">
                                            {format(new Date(book.start_date), 'yyyy.MM.dd', { locale: ko })}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">노트 수</span>
                                        <span className="text-xs text-slate-300 font-medium">{book.notes_count}개 / {book.total_chapters}챕터</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            독서 일지
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {publishedNotes.length > 0 ? (
                            publishedNotes.map((note) => (
                                <BookNoteCard key={note.id} note={note} bookSlug={book.slug} />
                            ))
                        ) : (
                            <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                                <p className="text-slate-500 italic">아직 작성된 공개 노트가 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
