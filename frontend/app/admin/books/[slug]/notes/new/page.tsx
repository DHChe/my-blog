'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Loader2, ListPlus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { createBookNote } from '@/lib/admin-api'
import { TagSelector } from '@/components/admin/TagSelector'

interface NewBookNotePageProps {
    params: Promise<{
        slug: string
    }>
}

export default function NewBookNotePage({ params }: NewBookNotePageProps) {
    const { slug } = use(params)
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [takeawayInput, setTakeawayInput] = useState('')
    const [formData, setFormData] = useState({
        chapter_number: undefined as number | undefined,
        chapter_title: '',
        pages: '',
        content: '',
        key_takeaways: [] as string[],
        questions: '',
        reading_date: new Date().toISOString().split('T')[0],
        tag_ids: [] as string[],
        is_published: true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await createBookNote(slug, formData)
            router.push(`/admin/books/${slug}/notes`)
            router.refresh()
        } catch (error) {
            console.error('Failed to create note:', error)
            alert('노트 등록에 실패했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                name === 'chapter_number' ? (value ? parseInt(value) : undefined) : value,
        }))
    }

    const addTakeaway = () => {
        if (takeawayInput.trim()) {
            setFormData(prev => ({
                ...prev,
                key_takeaways: [...prev.key_takeaways, takeawayInput.trim()]
            }))
            setTakeawayInput('')
        }
    }

    const removeTakeaway = (index: number) => {
        setFormData(prev => ({
            ...prev,
            key_takeaways: prev.key_takeaways.filter((_, i) => i !== index)
        }))
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <Link
                    href={`/admin/books/${slug}/notes`}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    노트 목록으로 돌아가기
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ListPlus className="w-6 h-6 text-teal-500" />
                    새 독서 노트 작성
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-widest text-[10px]">Title</label>
                            <input
                                type="text"
                                name="chapter_title"
                                required
                                value={formData.chapter_title}
                                onChange={handleChange}
                                placeholder="챕터 제목 또는 주제"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500 transition-colors text-lg font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 uppercase tracking-widest text-[10px]">Content (Markdown)</label>
                            <textarea
                                name="content"
                                required
                                rows={15}
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="배운 내용이나 생각을 자유롭게 기록하세요..."
                                className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500 transition-colors resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chapter</label>
                                    <input
                                        type="number"
                                        name="chapter_number"
                                        value={formData.chapter_number || ''}
                                        onChange={handleChange}
                                        placeholder="번호"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pages</label>
                                    <input
                                        type="text"
                                        name="pages"
                                        value={formData.pages}
                                        onChange={handleChange}
                                        placeholder="45-72"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reading Date</label>
                                <input
                                    type="date"
                                    name="reading_date"
                                    required
                                    value={formData.reading_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                />
                            </div>

                            <TagSelector
                                selectedTagIds={formData.tag_ids}
                                onChange={(ids) => setFormData(prev => ({ ...prev, tag_ids: ids }))}
                            />

                            <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-xl">
                                <label className="text-sm font-medium text-gray-300">공개 여부</label>
                                <input
                                    type="checkbox"
                                    name="is_published"
                                    checked={formData.is_published}
                                    onChange={handleChange}
                                    className="w-5 h-5 accent-teal-500"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl space-y-4">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                Key Takeaways
                                <span className="text-teal-500">{formData.key_takeaways.length}</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={takeawayInput}
                                    onChange={(e) => setTakeawayInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTakeaway())}
                                    placeholder="핵심 요약 추가..."
                                    className="flex-grow px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                                />
                                <button
                                    type="button"
                                    onClick={addTakeaway}
                                    className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {formData.key_takeaways.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300 group">
                                        <span className="mt-1.5 w-1 h-1 bg-teal-500 rounded-full flex-shrink-0" />
                                        <span className="flex-grow leading-relaxed">{item}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTakeaway(i)}
                                            className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Self Questions</label>
                            <textarea
                                name="questions"
                                rows={4}
                                value={formData.questions}
                                onChange={handleChange}
                                placeholder="내용에 대해 스스로 질문을 던져보세요..."
                                className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 resize-none italic"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-800 flex justify-end gap-3">
                    <Link
                        href={`/admin/books/${slug}/notes`}
                        className="px-8 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                    >
                        취소
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-12 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-bold shadow-lg shadow-teal-900/20"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        기록 저장하기
                    </button>
                </div>
            </form>
        </div>
    )
}
