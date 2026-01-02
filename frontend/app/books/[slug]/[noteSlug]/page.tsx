import { getBookNote, getBookBySlug } from '@/lib/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Tag as TagIcon, CheckCircle2, MessageSquare } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'

interface NoteDetailPageProps {
    params: {
        slug: string
        noteSlug: string
    }
}

export async function generateMetadata({ params }: NoteDetailPageProps): Promise<Metadata> {
    const note = await getBookNote(params.slug, params.noteSlug)
    if (!note) return { title: 'Note Not Found' }

    return {
        title: `${note.chapter_title} | 독서 노트`,
        description: note.ai_summary || note.content.substring(0, 160),
    }
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
    const [note, book] = await Promise.all([
        getBookNote(params.slug, params.noteSlug),
        getBookBySlug(params.slug)
    ])

    if (!note || !book) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex flex-col gap-6 mb-12">
                <Link
                    href={`/books/${params.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    {book.title} 목록으로 돌아가기
                </Link>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-black border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            {note.chapter_number || '•'}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-500/70 font-black uppercase tracking-[0.2em] leading-none mb-1">
                                CHAPTER {note.chapter_number || 'STORY'}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-100 italic">
                                {note.chapter_title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-600" />
                            {format(new Date(note.reading_date), 'yyyy년 M월 d일', { locale: ko })}
                        </div>
                        {note.pages && (
                            <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-slate-600">P.</span> {note.pages}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <TagIcon size={14} className="text-slate-600" />
                            <div className="flex gap-1.5">
                                {note.tags.map(tag => (
                                    <span key={tag.id} className="hover:underline decoration-emerald-500/50 underline-offset-4 cursor-default">
                                        #{tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="md:col-span-3 space-y-12">
                    {note.ai_summary && (
                        <div className="relative p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                            <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 leading-none opacity-60">
                                AI Summary
                            </span>
                            <p className="text-slate-300 italic leading-relaxed">
                                &quot;{note.ai_summary}&quot;
                            </p>
                        </div>
                    )}

                    <article className="prose prose-invert prose-slate max-w-none prose-blockquote:border-emerald-500/50 prose-blockquote:bg-emerald-500/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg prose-a:text-emerald-400 prose-headings:italic prose-headings:font-black">
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                    </article>
                </div>

                <aside className="md:col-span-1 space-y-8">
                    {note.key_takeaways && note.key_takeaways.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                Key Takeaways
                            </h3>
                            <ul className="space-y-4">
                                {note.key_takeaways.map((point, i) => (
                                    <li key={i} className="text-sm text-slate-400 leading-relaxed border-b border-white/5 pb-3">
                                        <span className="block text-[10px] font-mono text-slate-600 mb-1">0{i + 1}</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {note.questions && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-purple-500" />
                                Thought Provoking
                            </h3>
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl italic text-sm text-slate-400 leading-relaxed">
                                {note.questions}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}
