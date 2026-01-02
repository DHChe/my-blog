'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Edit2, Trash2, ExternalLink, MoreVertical, Check, X, Eye } from 'lucide-react'
import { TILResponse } from '@/lib/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TILTagManager } from './TILTagManager'

interface TILTableProps {
    tils: TILResponse[]
    onDelete?: (id: string) => void
    onBulkDelete?: (ids: string[]) => Promise<void>
    onPublishToggle?: (id: string, isPublished: boolean) => Promise<void>
    onTagUpdate?: () => void
}

export const TILTable = ({ tils, onDelete, onBulkDelete, onPublishToggle, onTagUpdate }: TILTableProps) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
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

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(tils.map(til => til.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (tilId: string, checked: boolean) => {
        const newSelected = new Set(selectedIds)
        if (checked) {
            newSelected.add(tilId)
        } else {
            newSelected.delete(tilId)
        }
        setSelectedIds(newSelected)
    }

    const handleBulkDelete = async () => {
        if (!onBulkDelete || selectedIds.size === 0) return
        
        const confirmed = window.confirm(`선택한 ${selectedIds.size}개의 TIL을 삭제하시겠습니까?`)
        if (!confirmed) return

        setIsBulkDeleting(true)
        try {
            await onBulkDelete(Array.from(selectedIds))
            setSelectedIds(new Set())
        } catch (error) {
            console.error('Failed to delete TILs:', error)
            alert('삭제 중 오류가 발생했습니다.')
        } finally {
            setIsBulkDeleting(false)
        }
    }

    const allSelected = tils.length > 0 && selectedIds.size === tils.length
    const someSelected = selectedIds.size > 0 && selectedIds.size < tils.length

    // 전체 선택 체크박스의 indeterminate 상태 설정
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = someSelected
        }
    }, [someSelected])

    const handleToggleMenu = (tilId: string) => {
        setOpenMenuId(openMenuId === tilId ? null : tilId)
    }

    const handlePublishToggle = async (tilId: string, currentStatus: boolean) => {
        if (!onPublishToggle) return
        
        setLoadingId(tilId)
        setOpenMenuId(null)
        try {
            await onPublishToggle(tilId, !currentStatus)
        } catch (error) {
            console.error('Failed to toggle publish status:', error)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="overflow-x-auto">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="px-6 py-3 bg-teal-900/20 border-b border-teal-700/50 flex items-center justify-between">
                    <span className="text-sm text-teal-400 font-medium">
                        {selectedIds.size}개 선택됨
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isBulkDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                삭제 중...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                선택 삭제
                            </>
                        )}
                    </button>
                </div>
            )}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                            <input
                                type="checkbox"
                                ref={selectAllCheckboxRef}
                                checked={allSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-teal-600 focus:ring-teal-500 focus:ring-2 cursor-pointer"
                            />
                        </th>
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Day</th>
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Tags</th>
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {tils.map((til) => (
                        <tr 
                            key={til.id} 
                            className={`hover:bg-gray-800/50 transition-colors ${selectedIds.has(til.id) ? 'bg-teal-900/10' : ''}`}
                        >
                            <td className="px-6 py-4">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(til.id)}
                                    onChange={(e) => handleSelectOne(til.id, e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-teal-600 focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-teal-400 font-medium">Day {til.day_number}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <Link
                                        href={`/admin/tils/${til.id}/edit`}
                                        className="text-white font-medium hover:text-teal-400 transition-colors"
                                    >
                                        {til.title}
                                    </Link>
                                    <p className="text-sm text-gray-400 line-clamp-1 mt-1">{til.excerpt}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <TILTagManager
                                    tilId={til.id}
                                    currentTagIds={til.tags.map((tag) => tag.id)}
                                    onUpdate={() => onTagUpdate?.()}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge isPublished={til.is_published} />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                                {new Date(til.created_at).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="relative flex items-center justify-end">
                                    <button
                                        onClick={() => handleToggleMenu(til.id)}
                                        disabled={loadingId === til.id}
                                        className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                        title="More actions"
                                    >
                                        {loadingId === til.id ? (
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <MoreVertical className="w-4 h-4" />
                                        )}
                                    </button>
                                    {openMenuId === til.id && (
                                        <div
                                            ref={(el) => (menuRefs.current[til.id] = el)}
                                            className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
                                        >
                                            <div className="py-1">
                                                {!til.is_published ? (
                                                    <button
                                                        onClick={() => handlePublishToggle(til.id, til.is_published)}
                                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Check className="w-4 h-4 text-teal-400" />
                                                        발행하기
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePublishToggle(til.id, til.is_published)}
                                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                    >
                                                        <X className="w-4 h-4 text-yellow-400" />
                                                        초안으로 변경
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/tils/${til.id}/edit`}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                    onClick={() => setOpenMenuId(null)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    편집
                                                </Link>
                                                <Link
                                                    href={`/til/${til.slug}`}
                                                    target="_blank"
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                    onClick={() => setOpenMenuId(null)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    새 탭에서 보기
                                                </Link>
                                                <div className="border-t border-gray-700 my-1" />
                                                <button
                                                    onClick={() => {
                                                        onDelete?.(til.id)
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
