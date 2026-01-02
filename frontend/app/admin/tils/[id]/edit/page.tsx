'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Edit2, Plus, X } from 'lucide-react'
import { getTags, TagResponse, TILUpdatePayload, TILResponse } from '@/lib/api'
import { getPostById, updatePost, createTag, deleteTag } from '@/lib/admin-api'
import { TagCreateModal } from '@/components/admin/TagCreateModal'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'

export default function EditTILPage() {
    const router = useRouter()
    const params = useParams()
    const tilId = params.id as string
    
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tags, setTags] = useState<TagResponse[]>([])
    const [til, setTil] = useState<TILResponse | null>(null)
    const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [dayNumber, setDayNumber] = useState<number>(1)
    const [excerpt, setExcerpt] = useState('')
    const [content, setContent] = useState('')
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [isPublished, setIsPublished] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // Fetch tags
                const fetchedTags = await getTags()
                setTags(fetchedTags)

                // Fetch TIL data
                const tilData = await getPostById(tilId)
                if (!tilData) {
                    setError('TIL을 찾을 수 없습니다.')
                    setIsLoading(false)
                    return
                }

                setTil(tilData)
                setTitle(tilData.title)
                setDayNumber(tilData.day_number)
                setExcerpt(tilData.excerpt)
                setContent(tilData.content)
                setSelectedTagIds(tilData.tags.map(tag => tag.id))
                setIsPublished(tilData.is_published)
            } catch (err) {
                console.error('Failed to fetch data:', err)
                setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
            } finally {
                setIsLoading(false)
            }
        }

        if (tilId) {
            fetchData()
        }
    }, [tilId])

    const handleSubmit = async (publish: boolean) => {
        if (!til) return

        setError(null)
        setIsSubmitting(true)

        try {
            const payload: TILUpdatePayload = {
                title,
                day_number: dayNumber,
                excerpt,
                content,
                tag_ids: selectedTagIds,
                is_published: publish,
            }

            await updatePost(tilId, payload)
            router.push('/admin/tils')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'TIL 업데이트에 실패했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleTag = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        )
    }

    const handleCreateTag = async (name: string) => {
        try {
            const newTag = await createTag(name)
            setTags((prev) => [...prev, newTag])
            setSelectedTagIds((prev) => [...prev, newTag.id])
            setIsCreateTagModalOpen(false)
        } catch (error) {
            console.error('Failed to create tag:', error)
            throw error
        }
    }

    const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('이 태그를 삭제하시겠습니까?\n모든 TIL에서 제거됩니다.')) {
            return
        }

        try {
            await deleteTag(tagId)
            setTags((prev) => prev.filter((tag) => tag.id !== tagId))
            setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
        } catch (error) {
            console.error('Failed to delete tag:', error)
            alert(error instanceof Error ? error.message : '태그 삭제에 실패했습니다.')
        }
    }

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">로딩 중...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!til) {
        return (
            <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-red-400">
                    <h2 className="text-xl font-semibold mb-2">TIL을 찾을 수 없습니다</h2>
                    <p className="mb-4">요청하신 TIL이 존재하지 않거나 삭제되었을 수 있습니다.</p>
                    <Link
                        href="/admin/tils"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로 돌아가기
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/tils"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">TIL 편집</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting || !title || !excerpt || !content}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {til.is_published ? '초안으로 저장' : '초안 저장'}
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting || !title || !excerpt || !content}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {til.is_published ? '업데이트 발행' : '발행하기'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Metadata Form */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            제목 <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="TIL 제목을 입력하세요"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            일차 (Day) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={dayNumber}
                            onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                            min={1}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                    </div>
                </div>
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        요약 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="TIL 내용을 간략히 요약해주세요 (최대 500자)"
                        rows={2}
                        maxLength={500}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                    />
                </div>
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">태그</label>
                        <button
                            type="button"
                            onClick={() => setIsCreateTagModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            새 태그 추가
                        </button>
                    </div>
                    {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="relative group"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTagIds.includes(tag.id)
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteTag(tag.id, e)}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                                        title="태그 삭제"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">등록된 태그가 없습니다. 새 태그를 추가해주세요.</p>
                    )}
                </div>
            </div>

            {/* Editor Tabs */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('write')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'write'
                            ? 'bg-gray-700 text-white border-b-2 border-teal-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <Edit2 className="w-4 h-4" />
                        작성
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'preview'
                            ? 'bg-gray-700 text-white border-b-2 border-teal-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        미리보기
                    </button>
                </div>

                {activeTab === 'write' ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Markdown 형식으로 내용을 작성하세요..."
                        className="w-full h-[500px] bg-gray-900 p-6 text-white font-mono text-sm focus:outline-none resize-none"
                    />
                ) : (
                    <div className="p-6 min-h-[500px]">
                        {content ? (
                            <MarkdownRenderer content={content} />
                        ) : (
                            <p className="text-gray-500 italic">미리볼 내용이 없습니다.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Tag Create Modal */}
            <TagCreateModal
                isOpen={isCreateTagModalOpen}
                onClose={() => setIsCreateTagModalOpen(false)}
                onSubmit={handleCreateTag}
            />
        </div>
    )
}

