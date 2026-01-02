'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit2, Trash2, MoreVertical } from 'lucide-react'
import { TagResponse } from '@/lib/api'

interface TagTableProps {
  tags: TagResponse[]
  onEdit?: (tag: TagResponse) => void
  onDelete?: (id: string) => void
}

export const TagTable = ({ tags, onEdit, onDelete }: TagTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const handleToggleMenu = (tagId: string) => {
    setOpenMenuId(openMenuId === tagId ? null : tagId)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              이름
            </th>
            <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              생성일
            </th>
            <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {tags.map((tag) => (
            <tr key={tag.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4">
                <span className="text-white font-medium">{tag.name}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-400 font-mono">{tag.slug}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">
                {new Date(tag.created_at).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="relative flex items-center justify-end">
                  <button
                    onClick={() => handleToggleMenu(tag.id)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === tag.id && (
                    <div
                      ref={(el) => (menuRefs.current[tag.id] = el)}
                      className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onEdit?.(tag)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          편집
                        </button>
                        <div className="border-t border-gray-700 my-1" />
                        <button
                          onClick={() => {
                            onDelete?.(tag.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

