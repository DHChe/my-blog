'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { TILTable } from '@/components/admin/TILTable'
import { TILListResponse, getPosts } from '@/lib/api'
import { updatePost, deletePost } from '@/lib/admin-api'

export default function AdminTILsPage() {
    const [data, setData] = useState<TILListResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
    const [page, setPage] = useState(1)

    const fetchTils = useCallback(async () => {
        setIsLoading(true)
        try {
            const publishedParam = statusFilter === 'all' ? undefined : statusFilter === 'published'
            const response = await getPosts(page, 10, undefined, publishedParam)
            setData(response)
        } catch (error) {
            console.error('Failed to fetch TILs:', error)
        } finally {
            setIsLoading(false)
        }
    }, [page, statusFilter])

    useEffect(() => {
        fetchTils()
    }, [fetchTils])

    const handlePublishToggle = async (tilId: string, isPublished: boolean) => {
        try {
            await updatePost(tilId, { is_published: isPublished })
            // 목록 새로고침
            await fetchTils()
        } catch (error) {
            console.error('Failed to toggle publish status:', error)
            throw error
        }
    }

    const handleBulkDelete = async (ids: string[]) => {
        try {
            // 각 TIL을 순차적으로 삭제
            await Promise.all(ids.map(id => deletePost(id)))
            // 목록 새로고침
            await fetchTils()
        } catch (error) {
            console.error('Failed to delete TILs:', error)
            throw error
        }
    }

    const filteredTils = data?.items.filter(til =>
        til.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        til.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">TIL 관리</h1>
                    <p className="text-gray-400 mt-1">부트캠프 학습 기록을 관리하고 발행합니다.</p>
                </div>
                <Link
                    href="/admin/tils/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors w-fit"
                >
                    <Plus className="w-4 h-4" />
                    새 TIL 작성
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-teal-500 transition-colors">
                            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="제목 또는 내용 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                        >
                            <option value="all">모든 상태</option>
                            <option value="published">발행됨</option>
                            <option value="draft">초안</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TIL List Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden text-white">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">로딩 중...</div>
                ) : filteredTils.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        {searchTerm ? '검색 결과가 없습니다.' : '작성된 TIL이 없습니다.'}
                    </div>
                ) : (
                    <>
                        <TILTable 
                            tils={filteredTils} 
                            onDelete={(id) => console.log('Delete', id)}
                            onBulkDelete={handleBulkDelete}
                            onPublishToggle={handlePublishToggle}
                            onTagUpdate={fetchTils}
                        />

                        {/* Pagination Placeholder */}
                        {data && data.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    총 {data.total}개 중 {(page - 1) * 10 + 1}-{Math.min(page * 10, data.total)}개 표시
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => prev - 1)}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                                    >
                                        이전
                                    </button>
                                    <button
                                        disabled={page === data.pages}
                                        onClick={() => setPage(prev => prev + 1)}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                                    >
                                        다음
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
