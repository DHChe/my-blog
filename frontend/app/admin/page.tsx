'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, FolderKanban, Tags, Plus, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/admin/StatCard'
import { TILListResponse, getPosts } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    tilCount: 0,
    projectCount: 0,
    tagCount: 0,
  })
  const [recentTils, setRecentTils] = useState<TILListResponse['items']>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch TIL list (including drafts)
        const tilData = await getPosts(1, 5)
        setRecentTils(tilData.items)
        setStats((prev) => ({
          ...prev,
          tilCount: tilData.total,
        }))

        // TODO: Fetch project and tag counts when APIs are ready
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="TIL"
            value={isLoading ? '...' : stats.tilCount}
            icon={FileText}
            description="부트캠프 학습 기록"
          />
          <StatCard
            title="프로젝트"
            value={isLoading ? '...' : stats.projectCount}
            icon={FolderKanban}
            description="포트폴리오 프로젝트"
          />
          <StatCard
            title="태그"
            value={isLoading ? '...' : stats.tagCount}
            icon={Tags}
            description="기술 태그"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">빠른 액션</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/tils/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 TIL 작성
            </Link>
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 프로젝트 추가
            </Link>
          </div>
        </div>

        {/* Recent TILs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">최근 TIL</h2>
            <Link
              href="/admin/tils"
              className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              전체 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-700">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-gray-500">
                로딩 중...
              </div>
            ) : recentTils.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                아직 작성된 TIL이 없습니다.
              </div>
            ) : (
              recentTils.map((til) => (
                <Link
                  key={til.id}
                  href={`/admin/tils/${til.id}/edit`}
                  className="block px-6 py-4 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-teal-400">
                          Day {til.day_number}
                        </span>
                        {!til.is_published && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-white font-medium">
                        {til.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-1">
                        {til.excerpt}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(til.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
    </div>
  )
}
