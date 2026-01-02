import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    basePath = "/til",
}: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    const getPageUrl = (page: number) => {
        if (page === 1) {
            return basePath;
        }
        return `${basePath}?page=${page}`;
    };

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <nav
            className="flex items-center justify-center gap-2 mt-12"
            aria-label="페이지네이션"
        >
            {currentPage > 1 ? (
                <Link
                    href={getPageUrl(currentPage - 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-md border border-lightest-navy/50 bg-light-navy/30 text-slate hover:bg-light-navy/50 hover:text-green hover:border-green transition-all"
                    aria-label="이전 페이지"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Link>
            ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-md border border-lightest-navy/30 bg-light-navy/20 text-slate/30 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                </div>
            )}

            {startPage > 1 && (
                <>
                    <Link
                        href={getPageUrl(1)}
                        className={`flex items-center justify-center w-10 h-10 rounded-md border transition-all ${
                            1 === currentPage
                                ? "border-green bg-green-tint text-green"
                                : "border-lightest-navy/50 bg-light-navy/30 text-slate hover:bg-light-navy/50 hover:text-green hover:border-green"
                        }`}
                    >
                        1
                    </Link>
                    {startPage > 2 && (
                        <span className="text-slate/50 px-2">...</span>
                    )}
                </>
            )}

            {pages.map((page) => (
                <Link
                    key={page}
                    href={getPageUrl(page)}
                    className={`flex items-center justify-center w-10 h-10 rounded-md border transition-all ${
                        page === currentPage
                            ? "border-green bg-green-tint text-green"
                            : "border-lightest-navy/50 bg-light-navy/30 text-slate hover:bg-light-navy/50 hover:text-green hover:border-green"
                    }`}
                    aria-label={`페이지 ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                >
                    {page}
                </Link>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="text-slate/50 px-2">...</span>
                    )}
                    <Link
                        href={getPageUrl(totalPages)}
                        className={`flex items-center justify-center w-10 h-10 rounded-md border transition-all ${
                            totalPages === currentPage
                                ? "border-green bg-green-tint text-green"
                                : "border-lightest-navy/50 bg-light-navy/30 text-slate hover:bg-light-navy/50 hover:text-green hover:border-green"
                        }`}
                    >
                        {totalPages}
                    </Link>
                </>
            )}

            {currentPage < totalPages ? (
                <Link
                    href={getPageUrl(currentPage + 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-md border border-lightest-navy/50 bg-light-navy/30 text-slate hover:bg-light-navy/50 hover:text-green hover:border-green transition-all"
                    aria-label="다음 페이지"
                >
                    <ChevronRight className="h-4 w-4" />
                </Link>
            ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-md border border-lightest-navy/30 bg-light-navy/20 text-slate/30 cursor-not-allowed">
                    <ChevronRight className="h-4 w-4" />
                </div>
            )}
        </nav>
    );
}

