'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, ChevronLeft, FileText, Wand2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { BookResponse, BookNoteResponse, getBookBySlug } from '@/lib/api'
import { deleteBookNote, summarizeBookNote } from '@/lib/admin-api'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AdminBookNotesPageProps {
    params: Promise<{
        slug: string
    }>
}

export default function AdminBookNotesPage({ params }: AdminBookNotesPageProps) {
    const { slug } = use(params)
    const [book, setBook] = useState<BookResponse | null>(null)
    const [notes, setNotes] = useState<BookNoteResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [summarizingId, setSummarizingId] = useState<string | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const data = await getBookBySlug(slug)
            if (data) {
                setBook(data)
                // Sort notes by reading date descending, then chapter number
                const sortedNotes = [...data.notes].sort((a, b) => {
                    const dateDiff = new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
                    if (dateDiff !== 0) return dateDiff
                    return (b.chapter_number || 0) - (a.chapter_number || 0)
                })
                setNotes(sortedNotes)
            }
        } catch (error) {
            console.error('Failed to fetch book notes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [slug])

    const handleDelete = async (note: BookNoteResponse) => {
        if (!confirm(`"Chapter ${note.chapter_number}: ${note.chapter_title}" 노트를 삭제하시겠습니까?`)) {
            return
        }

        try {
            await deleteBookNote(slug, note.id)
            await fetchData()
        } catch (error) {
            console.error('Failed to delete note:', error)
            alert('노트 삭제에 실패했습니다.')
        }
    }

    const handleSummarize = async (note: BookNoteResponse) => {
        setSummarizingId(note.id)
        try {
            await summarizeBookNote(slug, note.id)
            await fetchData() // Refresh to see updated summary
        } catch (error) {
            console.error('Failed to summarize note:', error)
            alert('AI 요약 생성에 실패했습니다.')
        } finally {
            setSummarizingId(null)
        }
    }

    if (isLoading && !book) {
        return <div className="p-12 text-center text-gray-500 italic">로딩 중...</div>
    }

    if (!book) {
        return <div className="p-12 text-center text-gray-500 italic">도서를 찾을 수 없습니다.</div>
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <Link
                    href="/admin/books"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    도서 관리로 돌아가기
                </Link>

                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1 block">{book.author}</span>
                        <h1 className="text-2xl font-bold text-white italic">{book.title}</h1>
                        <p className="text-sm text-gray-400 mt-1">총 {notes.length}개의 독서 노트를 관리합니다.</p>
                    </div>
                    <Link
                        href={`/admin/books/${slug}/notes/new`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        새 노트 작성
                    </Link>
                </div>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="divide-y divide-gray-700">
                    {notes.length === 0 ? (
                        <div className="px-6 py-20 text-center text-gray-500 italic">
                            아직 작성된 독서 로그가 없습니다. 새 노트를 추가해 보세요!
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="p-6 hover:bg-gray-700/30 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-900 text-teal-400 border border-gray-700">
                                                Ch.{note.chapter_number || '-'}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-100 group-hover:text-teal-400 transition-colors">
                                                {note.chapter_title}
                                            </h3>
                                            {note.is_published ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    <Eye className="w-3 h-3" /> Published
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    <EyeOff className="w-3 h-3" /> Draft
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                {format(new Date(note.reading_date), 'yyyy년 M월 d일', { locale: ko })}
                                            </span>
                                            {note.pages && (
                                                <span>p.{note.pages}</span>
                                            )}
                                            <div className="flex gap-1.5 ml-2">
                                                {note.tags.map(tag => (
                                                    <span key={tag.id} className="text-gray-500">#{tag.name}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {note.ai_summary && (
                                            <div className="mt-3 p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl text-sm italic text-gray-400 line-clamp-2">
                                                "{note.ai_summary}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button
                                            onClick={() => handleSummarize(note)}
                                            disabled={summarizingId === note.id}
                                            title="AI 요약 생성"
                                            className="p-2.5 text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors border border-transparent hover:border-purple-500/20"
                                        >
                                            {summarizingId === note.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Wand2 className="w-4 h-4" />
                                            )}
                                        </button>
                                        <Link
                                            href={`/admin/books/${slug}/notes/${note.id}/edit`}
                                            className="p-2.5 text-teal-400 hover:bg-teal-500/10 rounded-xl transition-colors border border-transparent hover:border-teal-500/20"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(note)}
                                            className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <Link
                                            href={`/books/${slug}/${note.slug}`}
                                            target="_blank"
                                            className="p-2.5 text-gray-400 hover:bg-gray-500/10 rounded-xl transition-colors border border-transparent hover:border-gray-500/20"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function ExternalLink({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    )
}
