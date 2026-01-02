'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { TagTable } from '@/components/admin/TagTable'
import { TagCreateModal } from '@/components/admin/TagCreateModal'
import { TagEditModal } from '@/components/admin/TagEditModal'
import {
  TagResponse,
  getTags,
} from '@/lib/api'
import { createTag, updateTag, deleteTag } from '@/lib/admin-api'

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagResponse | null>(null)
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getTags()
      setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleCreate = async (name: string) => {
    await createTag(name)
    await fetchTags()
  }

  const handleEdit = async (tagId: string, name: string) => {
    await updateTag(tagId, name)
    await fetchTags()
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm('정말 이 태그를 삭제하시겠습니까?\n연결된 TIL에서도 제거됩니다.')) {
      return
    }

    setDeletingTagId(tagId)
    try {
      await deleteTag(tagId)
      await fetchTags()
    } catch (error) {
      console.error('Failed to delete tag:', error)
      alert(error instanceof Error ? error.message : '태그 삭제에 실패했습니다.')
    } finally {
      setDeletingTagId(null)
    }
  }

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">태그 관리</h1>
          <p className="text-gray-400 mt-1">
            기술 태그를 관리하고 TIL에 연결합니다.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          새 태그 추가
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
        <div className="relative flex-1">
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-teal-500 transition-colors">
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="태그 이름 또는 슬러그 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tags List Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden text-white">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : filteredTags.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 태그가 없습니다.'}
          </div>
        ) : (
          <TagTable
            tags={filteredTags}
            onEdit={(tag) => setEditingTag(tag)}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modals */}
      <TagCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
      <TagEditModal
        isOpen={editingTag !== null}
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        onSubmit={handleEdit}
      />
    </div>
  )
}


