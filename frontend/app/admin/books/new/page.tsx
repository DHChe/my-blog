'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createBook } from '@/lib/admin-api'

export default function NewBookPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        cover_image: '',
        total_chapters: 1,
        status: 'reading' as const,
        start_date: new Date().toISOString().split('T')[0],
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await createBook(formData)
            router.push('/admin/books')
            router.refresh()
        } catch (error) {
            console.error('Failed to create book:', error)
            alert('도서 등록에 실패했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'total_chapters' ? parseInt(value) || 1 : value,
        }))
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/books"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    목록으로 돌아가기
                </Link>
                <h1 className="text-2xl font-bold text-white">새 도서 등록</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">제목</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="도서 제목을 입력하세요"
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">저자</label>
                            <input
                                type="text"
                                name="author"
                                required
                                value={formData.author}
                                onChange={handleChange}
                                placeholder="저자 이름을 입력하세요"
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">전체 챕터 수</label>
                                <input
                                    type="number"
                                    name="total_chapters"
                                    required
                                    min="1"
                                    value={formData.total_chapters}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">상태</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                                >
                                    <option value="reading">읽는 중</option>
                                    <option value="completed">완독</option>
                                    <option value="on_hold">잠시 멈춤</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">시작일</label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">표지 이미지 URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    name="cover_image"
                                    value={formData.cover_image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="aspect-[3/4] relative rounded-xl border border-dashed border-gray-700 bg-gray-900/50 flex flex-col items-center justify-center text-gray-600 overflow-hidden">
                            {formData.cover_image ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={formData.cover_image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = ''
                                        alert('올바른 이미지 URL이 아닙니다.')
                                    }}
                                />
                            ) : (
                                <>
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <span className="text-xs">이미지 미리보기</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                    <Link
                        href="/admin/books"
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        취소
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-8 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        저장하기
                    </button>
                </div>
            </form>
        </div>
    )
}
