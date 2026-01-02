'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { TagResponse, getTags } from '@/lib/api'

interface TagSelectorProps {
    selectedTagIds: string[]
    onChange: (tagIds: string[]) => void
}

export const TagSelector = ({
    selectedTagIds,
    onChange,
}: TagSelectorProps) => {
    const [allTags, setAllTags] = useState<TagResponse[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchTags = async () => {
            setIsLoading(true)
            try {
                const tags = await getTags()
                setAllTags(tags)
            } catch (err) {
                console.error('Failed to fetch tags:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchTags()
    }, [])

    const toggleTag = (tagId: string) => {
        const newTags = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter((id) => id !== tagId)
            : [...selectedTagIds, tagId]
        onChange(newTags)
    }

    const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))
    const availableTags = allTags.filter((tag) => !selectedTagIds.includes(tag.id))

    return (
        <div className="space-y-4 p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <TagIcon className="w-4 h-4 text-teal-500" />
                태그 선택
            </div>

            <div className="space-y-3">
                {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded-full text-xs transition-colors hover:bg-teal-700 font-bold"
                            >
                                {tag.name}
                                <X className="w-3 h-3" />
                            </button>
                        ))}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-xs text-gray-500 italic">태그 로딩 중...</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs transition-colors hover:bg-gray-700 border border-gray-700"
                            >
                                {tag.name}
                            </button>
                        ))}
                        {availableTags.length === 0 && selectedTags.length === 0 && (
                            <p className="text-xs text-gray-500">등록된 태그가 없습니다.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
