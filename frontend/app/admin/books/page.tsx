'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Library, ExternalLink, FileText } from 'lucide-react'
import { BookResponse, getBookList } from '@/lib/api'
import { deleteBook } from '@/lib/admin-api'

export default function AdminBooksPage() {
    const [books, setBooks] = useState<BookResponse[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const fetchBooks = async () => {
        setIsLoading(true)
        try {
            const data = await getBookList(1, 100)
            setBooks(data.items)
            setTotal(data.total)
        } catch (error) {
            console.error('Failed to fetch books:', error)
            alert('도서 목록을 가져오는데 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBooks()
    }, [])

    const handleDelete = async (book: BookResponse) => {
        if (!confirm(`"${book.title}"을(를) 삭제하시겠습니까? 관련 노트가 모두 삭제됩니다.`)) {
            return
        }

        try {
            await deleteBook(book.id)
            await fetchBooks()
        } catch (error) {
            console.error('Failed to delete book:', error)
            alert('도서 삭제에 실패했습니다.')
        }
    }

    const statusLabels = {
        reading: '읽는 중',
        completed: '완독',
        on_hold: '잠시 멈춤',
    }

    const statusColors = {
        reading: 'text-emerald-400 bg-emerald-500/10',
        completed: 'text-blue-400 bg-blue-500/10',
        on_hold: 'text-slate-400 bg-slate-500/10',
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Library className="w-6 h-6 text-teal-500" />
                        도서 관리
                        <span className="text-sm font-normal text-gray-400 ml-2">전체 {total}권</span>
                    </h1>
                </div>
                <Link
                    href="/admin/books/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    새 도서 추가
                </Link>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 border-b border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">도서 정보</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">상태</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">기록</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">액션</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">로딩 중...</td>
                            </tr>
                        ) : books.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">등록된 도서가 없습니다.</td>
                            </tr>
                        ) : (
                            books.map((book) => (
                                <tr key={book.id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{book.title}</span>
                                            <span className="text-xs text-gray-500">{book.author}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${statusColors[book.status]}`}>
                                            {statusLabels[book.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <FileText className="w-3 h-3 text-gray-500" />
                                            <span>{book.notes_count}개의 노트</span>
                                        </div>
                                        <div className="w-24 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-teal-500"
                                                style={{ width: `${book.progress}%` }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/books/${book.slug}/notes`}
                                                title="노트 관리"
                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/admin/books/${book.slug}/edit`}
                                                title="수정"
                                                className="p-2 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(book)}
                                                title="삭제"
                                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link
                                                href={`/books/${book.slug}`}
                                                target="_blank"
                                                title="블로그에서 보기"
                                                className="p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
