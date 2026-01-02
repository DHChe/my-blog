import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface TILCardProps {
    title: string;
    date: string;
    excerpt: string;
    tags: { name: string; slug: string }[];
    slug: string;
    dayNumber?: number;
    href?: string;
    isExternal?: boolean;
}

export const TILCard = ({
    title,
    date,
    excerpt,
    tags,
    slug,
    dayNumber,
    href,
    isExternal = false,
}: TILCardProps) => {
    const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const linkHref = href || `/til/${slug}`;

    const CardContent = (
        <div className="h-full transition-all">
            <header
                className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate flex items-center justify-between"
                aria-label={dayNumber ? `Day ${dayNumber}, ${formattedDate}` : formattedDate}
            >
                <div className="flex flex-col">
                    {dayNumber !== undefined && (
                        <span className="text-green font-mono">Day {dayNumber}</span>
                    )}
                    <span>{formattedDate}</span>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                        {tags.map((tag) => (
                            <span
                                key={tag.slug}
                                className="text-green text-xs font-mono px-2 py-0.5 rounded"
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </header>
            <h3 className="mb-3 font-medium leading-snug text-lightest-slate">
                <span className="inline-flex items-baseline font-medium leading-tight text-lightest-slate group-hover:text-green group-focus-visible:text-green text-base">
                    <span>
                        {title}
                        <ArrowUpRight className="inline-block h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:translate-x-1 motion-reduce:transition-none ml-1 translate-y-px" />
                    </span>
                </span>
            </h3>
            <p className="mb-4 text-sm leading-normal text-slate line-clamp-3">
                {excerpt}
            </p>
        </div>
    );

    if (isExternal) {
        return (
            <a
                href={linkHref}
                target="_blank"
                rel="noreferrer noopener"
                className="group block h-full cursor-pointer"
                aria-label={`${title} (새 탭에서 열기)`}
            >
                {CardContent}
            </a>
        );
    }

    return (
        <Link
            href={linkHref}
            className="group block h-full cursor-pointer"
            aria-label={title}
        >
            {CardContent}
        </Link>
    );
};

