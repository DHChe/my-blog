'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/admin-auth'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Admin' }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-semibold text-white">{title}</h1>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>로그아웃</span>
      </button>
    </header>
  )
}
