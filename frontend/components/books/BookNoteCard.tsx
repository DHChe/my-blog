import Link from 'next/link'
import type { BookNoteResponse } from '@/lib/api'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface BookNoteCardProps {
    note: BookNoteResponse
    bookSlug: string
}

export function BookNoteCard({ note, bookSlug }: BookNoteCardProps) {
    return (
        <Link
            href={`/books/${bookSlug}/${note.slug}`}
            className="group block p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5"
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                        {note.chapter_number || '•'}
                    </span>
                    <div className="flex flex-col">
                        <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {note.chapter_title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                            {format(new Date(note.reading_date), 'yyyy년 M월 d일', { locale: ko })}
                        </span>
                    </div>
                    {note.pages && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            p.{note.pages}
                        </span>
                    )}
                </div>

                {note.ai_summary && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed italic">
                        &quot;{note.ai_summary}&quot;
                    </p>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                    {note.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag.id}
                            className="text-[10px] px-2 py-1 rounded-md bg-slate-800/50 text-slate-500 border border-slate-800"
                        >
                            #{tag.name}
                        </span>
                    ))}
                    {note.key_takeaways && note.key_takeaways.length > 0 && (
                        <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/5 text-emerald-500/70 border border-emerald-500/10 ml-auto font-medium">
                            +{note.key_takeaways.length} Key Takeaways
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
