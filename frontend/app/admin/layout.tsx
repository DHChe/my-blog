'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { Header } from '@/components/admin/Header'

const getPageTitle = (pathname: string): string => {
  if (pathname === '/admin') return '대시보드'
  if (pathname.startsWith('/admin/tils')) return 'TIL 관리'
  if (pathname.startsWith('/admin/projects')) return '프로젝트 관리'
  if (pathname.startsWith('/admin/tags')) return '태그 관리'
  if (pathname.startsWith('/admin/profile')) return '프로필'
  return 'Admin'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <AuthGuard>
      {isLoginPage ? (
        // Login page: no sidebar
        <>{children}</>
      ) : (
        // Admin pages: with sidebar
        <div className="min-h-screen bg-gray-900">
          <Sidebar />
          <div className="ml-64 flex flex-col min-h-screen">
            <Header title={getPageTitle(pathname)} />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
