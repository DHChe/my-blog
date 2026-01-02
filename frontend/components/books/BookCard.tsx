import Link from 'next/link'
import Image from 'next/image'
import type { BookResponse } from '@/lib/api'

interface BookCardProps {
    book: BookResponse
}

export function BookCard({ book }: BookCardProps) {
    const statusLabels = {
        reading: '읽는 중',
        completed: '완독',
        on_hold: '잠시 멈춤',
    }

    const statusColors = {
        reading: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        on_hold: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    }

    return (
        <Link
            href={`/books/${book.slug}`}
            className="group relative flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5"
        >
            <div className="aspect-[3/4] relative overflow-hidden bg-slate-800">
                {book.cover_image ? (
                    <Image
                        src={book.cover_image}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 italic px-4 text-center">
                        {book.title}
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${statusColors[book.status]}`}>
                        {statusLabels[book.status]}
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                    {book.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-1">
                    {book.author}
                </p>

                <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-end text-xs mb-1">
                        <span className="text-slate-500">독서 진행률</span>
                        <span className="font-medium text-slate-300">{Math.round(book.progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${book.progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>{book.notes_count}개의 노트</span>
                        <span>전체 {book.total_chapters}챕터</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
