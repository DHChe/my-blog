'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagResponse } from '@/lib/api'

interface TagEditModalProps {
  isOpen: boolean
  tag: TagResponse | null
  onClose: () => void
  onSubmit: (tagId: string, name: string) => Promise<void>
}

export const TagEditModal = ({
  isOpen,
  tag,
  onClose,
  onSubmit,
}: TagEditModalProps) => {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && tag) {
      setName(tag.name)
      setError(null)
    }
  }, [isOpen, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tag) return

    setError(null)

    if (!name.trim()) {
      setError('태그 이름을 입력해주세요.')
      return
    }

    if (name.length > 50) {
      setError('태그 이름은 50자 이하여야 합니다.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(tag.id, name.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '태그 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !tag) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">태그 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="tag-name-edit"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                태그 이름
              </label>
              <Input
                id="tag-name-edit"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: Python, FastAPI, Database"
                maxLength={50}
                disabled={isSubmitting}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-teal-500"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                {name.length}/50자 (슬러그는 자동 재생성됩니다)
              </p>
              <p className="mt-2 text-xs text-gray-400">
                현재 슬러그: <span className="font-mono text-gray-300">{tag.slug}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || name === tag.name}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  수정 중...
                </>
              ) : (
                '수정'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}






