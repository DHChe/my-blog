import type { ReadingStatsResponse } from '@/lib/api'
import { BookOpen, CheckCircle2, FileText, Calendar, Library } from 'lucide-react'

interface ReadingStatsProps {
    stats: ReadingStatsResponse
}

export function ReadingStats({ stats }: ReadingStatsProps) {
    const items = [
        {
            label: '전체 도서',
            value: stats.total_books,
            icon: Library,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            label: '읽고 있는 책',
            value: stats.reading_books,
            icon: BookOpen,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
        {
            label: '완독한 책',
            value: stats.completed_books,
            icon: CheckCircle2,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            label: '전체 노트',
            value: stats.total_notes,
            icon: FileText,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
        {
            label: '이번 달 기록',
            value: stats.notes_this_month,
            icon: Calendar,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-slate-700 transition-colors"
                >
                    <div className={`p-2 rounded-xl mb-3 ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {item.label}
                    </span>
                    <span className="text-2xl font-black text-slate-100 italic">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    )
}
