'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { TagResponse, getTags } from '@/lib/api'
import { updatePost } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'

interface TILTagManagerProps {
  tilId: string
  currentTagIds: string[]
  onUpdate: () => void
}

export const TILTagManager = ({
  tilId,
  currentTagIds,
  onUpdate,
}: TILTagManagerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [allTags, setAllTags] = useState<TagResponse[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(currentTagIds)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Always fetch tags on mount and when currentTagIds change
    fetchTags()
  }, [currentTagIds])

  useEffect(() => {
    if (isOpen) {
      setSelectedTagIds(currentTagIds)
      setError(null)
    }
  }, [isOpen, currentTagIds])

  const fetchTags = async () => {
    try {
      const tags = await getTags()
      setAllTags(tags)
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await updatePost(tilId, { tag_ids: selectedTagIds })
      setIsOpen(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '태그 업데이트에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))
  const availableTags = allTags.filter((tag) => !selectedTagIds.includes(tag.id))
  const currentTags = allTags.filter((tag) => currentTagIds.includes(tag.id))

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-teal-400 transition-colors"
        title="태그 관리"
      >
        <TagIcon className="w-3 h-3" />
        {currentTags.length > 0 ? (
          <span className="flex items-center gap-1">
            {currentTags.map((tag) => (
              <span key={tag.id} className="px-1.5 py-0.5 bg-teal-600/20 text-teal-400 rounded">
                {tag.name}
              </span>
            ))}
          </span>
        ) : (
          <span>태그 추가</span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">태그 관리</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    선택된 태그 ({selectedTags.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded-full text-sm transition-colors hover:bg-teal-700"
                      >
                        {tag.name}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  사용 가능한 태그
                </label>
                {availableTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm transition-colors hover:bg-gray-600"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">모든 태그가 선택되었습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

