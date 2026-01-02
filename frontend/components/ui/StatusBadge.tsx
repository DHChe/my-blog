import React from 'react'

interface StatusBadgeProps {
    isPublished: boolean
}

export const StatusBadge = ({ isPublished }: StatusBadgeProps) => {
    if (isPublished) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Published
            </span>
        )
    }

    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Draft
        </span>
    )
}
