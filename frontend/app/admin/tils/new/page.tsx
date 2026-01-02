'use client'

import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Edit2, Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { getTags, getPosts, TagResponse, TILCreatePayload } from '@/lib/api'
import { createPost, createTag, deleteTag } from '@/lib/admin-api'
import { TagCreateModal } from '@/components/admin/TagCreateModal'
import { AIGeneratorModal } from '@/components/admin/AIGeneratorModal'
import { getApiKey } from '@/lib/admin-auth'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'

export default function NewTILPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tags, setTags] = useState<TagResponse[]>([])
    const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
    const [isAIModalOpen, setIsAIModalOpen] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [dayNumber, setDayNumber] = useState<number>(1)
    const [excerpt, setExcerpt] = useState('')
    const [content, setContent] = useState('')
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [isPublished, setIsPublished] = useState(false)
    
    // AI 스트리밍 상태
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingProgress, setStreamingProgress] = useState('')
    const contentBufferRef = useRef('')

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch tags
                const fetchedTags = await getTags()
                setTags(fetchedTags)

                // Fetch TILs to determine next day number
                const tilData = await getPosts(1, 100) // Fetch enough to find max day
                if (tilData.items.length > 0) {
                    const maxDay = Math.max(...tilData.items.map(til => til.day_number))
                    setDayNumber(maxDay + 1)
                }
            } catch (err) {
                console.error('Failed to fetch initial data:', err)
            }
        }
        fetchInitialData()
    }, [])


    const handleSubmit = async (publish: boolean) => {
        setError(null)
        setIsSubmitting(true)

        try {
            const payload: TILCreatePayload = {
                title,
                day_number: dayNumber,
                excerpt,
                content,
                tag_ids: selectedTagIds,
                is_published: publish,
            }

            await createPost(payload)
            router.push('/admin/tils')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create TIL')
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

    const handleAIGenerated = (data: {
        title: string
        excerpt: string
        content: string
        dayNumber: number
    }) => {
        setTitle(data.title)
        setExcerpt(data.excerpt)
        setContent(data.content)
        setDayNumber(data.dayNumber)
    }

    const handleStreamStart = async (inputType: 'text' | 'url' | 'file', inputContent: string, file?: File) => {
        setIsStreaming(true)
        setStreamingProgress('생성 시작...')
        setError(null)
        contentBufferRef.current = ''
        setContent('')
        setTitle('')
        setExcerpt('')

        const apiKey = getApiKey()
        if (!apiKey) {
            setError('인증이 필요합니다. 다시 로그인해주세요.')
            setIsStreaming(false)
            return
        }

        try {
            let response: Response

            // 파일 업로드인 경우 FormData 사용
            if (inputType === 'file' && file) {
                const formData = new FormData()
                formData.append('file', file)

                response = await fetch('/api/v1/generate/upload', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                    },
                    body: formData,
                })
            } else {
                // 텍스트 또는 URL인 경우 JSON 사용
                response = await fetch('/api/v1/generate/stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                    },
                    body: JSON.stringify({
                        input_type: inputType,
                        content: inputContent,
                    }),
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || '생성 요청 실패')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('스트림을 읽을 수 없습니다')

            const decoder = new TextDecoder()
            let buffer = ''
            let currentDayNumber = dayNumber
            let currentTitle = ''
            let currentExcerpt = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                let currentEvent = ''
                let currentData = ''

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.slice(7)
                    } else if (line.startsWith('data: ')) {
                        currentData = line.slice(6)
                    } else if (line === '' && currentEvent && currentData) {
                        try {
                            const data = JSON.parse(currentData)

                            switch (currentEvent) {
                                case 'day_number':
                                    currentDayNumber = data.day_number
                                    setDayNumber(currentDayNumber)
                                    setStreamingProgress(`Day ${currentDayNumber} 생성 중...`)
                                    break
                                case 'content_chunk':
                                    // 스트리밍 콘텐츠를 실시간으로 업데이트
                                    contentBufferRef.current += data.chunk
                                    flushSync(() => {
                                        setContent(contentBufferRef.current)
                                    })
                                    break
                                case 'title':
                                    currentTitle = data.title
                                    flushSync(() => {
                                        setTitle(currentTitle)
                                    })
                                    setStreamingProgress('제목 생성 완료')
                                    break
                                case 'excerpt':
                                    currentExcerpt = data.excerpt
                                    flushSync(() => {
                                        setExcerpt(currentExcerpt)
                                    })
                                    setStreamingProgress('요약 생성 완료')
                                    break
                                case 'complete':
                                    setStreamingProgress('생성 완료!')
                                    setIsStreaming(false)
                                    // 작성 탭으로 자동 전환
                                    setActiveTab('write')
                                    break
                                case 'error':
                                    throw new Error(data.error as string)
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.error('JSON parse error:', currentData)
                            } else {
                                throw e
                            }
                        }
                        currentEvent = ''
                        currentData = ''
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다')
            setIsStreaming(false)
        }
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
                    <h1 className="text-2xl font-bold text-white">새 TIL 작성</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI 초안 생성
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting || !title || !excerpt || !content}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        초안 저장
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting || !title || !excerpt || !content}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        발행하기
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

            {/* AI Generator Modal */}
            <AIGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onGenerated={handleAIGenerated}
                onStreamStart={handleStreamStart}
            />
            
            {/* 스트리밍 진행 상태 표시 */}
            {isStreaming && (
                <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg flex items-center gap-3 z-50">
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    <div>
                        <p className="text-sm font-medium text-white">AI 초안 생성 중</p>
                        <p className="text-xs text-gray-400">{streamingProgress}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
