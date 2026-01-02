"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

// 각 섹션의 scroll-mt 값 (lg 브레이크포인트 기준)
const SECTION_SCROLL_MARGINS: Record<string, { lg: number; md: number; base: number }> = {
    about: { lg: 28, md: 24, base: 20 },
    til: { lg: 96, md: 24, base: 20 },
    reading: { lg: 96, md: 24, base: 20 },
    project: { lg: 28, md: 24, base: 20 },
    blog: { lg: 28, md: 24, base: 20 },
};

const navLinks = [
    { name: "소개", url: "/#about" },
    { name: "TIL", url: "/#til" },
    { name: "독서 노트", url: "/#reading" },
    { name: "프로젝트", url: "/#project" },
    { name: "블로그", url: "/#blog" },
];

export const Sidebar = () => {
    const [scrollDirection, setScrollDirection] = useState("up");
    const [scrolledToTop, setScrolledToTop] = useState(true);

    useEffect(() => {
        let lastScrollY = window.pageYOffset;

        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;
            const direction = scrollY > lastScrollY ? "down" : "up";
            if (
                direction !== scrollDirection &&
                (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)
            ) {
                setScrollDirection(direction);
            }
            lastScrollY = scrollY > 0 ? scrollY : 0;
            setScrolledToTop(scrollY < 50);
        };

        window.addEventListener("scroll", updateScrollDirection);
        return () => window.removeEventListener("scroll", updateScrollDirection);
    }, [scrollDirection]);

    return (
        <header
            className={cn(
                "fixed top-0 z-50 flex items-center justify-between w-full px-12 h-[100px] transition-all duration-300 ease-in-out bg-navy/85 backdrop-blur-md shadow-navy-shadow",
                scrollDirection === "down" && !scrolledToTop ? "top-[-100px]" : "top-0",
                !scrolledToTop ? "h-[70px] shadow-lg" : "h-[100px]"
            )}
        >
            <nav className="flex items-center justify-between w-full font-mono">
                <div className="group relative">
                    <Link href="/" className="text-green w-12 h-12 block relative z-10">
                        <svg
                            id="logo"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            viewBox="0 0 84 96"
                            className="fill-none stroke-green stroke-2 transition-all group-hover:fill-green-tint"
                        >
                            <title>Logo</title>
                            <g transform="translate(-8.000000, -2.000000)">
                                <g transform="translate(11.000000, 5.000000)">
                                    <polygon
                                        id="Shape"
                                        points="39 0 0 22 0 67 39 90 78 68 78 23"
                                    />
                                    <path
                                        d="M45.691,67.34 L54.521,67.34 L54.521,29.84 L45.691,29.84 L45.691,67.34 Z M28.521,67.34 L37.351,67.34 L37.351,29.84 L28.521,29.84 L28.521,67.34 Z"
                                        fill="currentColor"
                                        className="fill-green stroke-0"
                                    />
                                </g>
                            </g>
                        </svg>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <ol className="flex items-center gap-8 list-none p-0 m-0">
                        {navLinks.map(({ name, url }, i) => {
                            const targetId = url.replace("/#", "");
                            return (
                                <li key={i} className="relative counter-reset-item">
                                    <Link
                                        href={url}
                                        onClick={(e) => {
                                            // 홈페이지가 아닌 경우 기본 동작 허용
                                            if (window.location.pathname !== "/") {
                                                return;
                                            }
                                            
                                            e.preventDefault();
                                            const element = document.getElementById(targetId);
                                            if (element) {
                                                // 현재 뷰포트 크기에 맞는 scroll-mt 값 가져오기
                                                const getScrollMargin = () => {
                                                    const margins = SECTION_SCROLL_MARGINS[targetId];
                                                    if (!margins) return 0;
                                                    
                                                    if (window.innerWidth >= 1024) {
                                                        return margins.lg;
                                                    } else if (window.innerWidth >= 768) {
                                                        return margins.md;
                                                    } else {
                                                        return margins.base;
                                                    }
                                                };

                                                const scrollMargin = getScrollMargin();
                                                
                                                // 섹션의 실제 위치 계산 (scroll-mt 고려)
                                                const elementRect = element.getBoundingClientRect();
                                                const elementTop = elementRect.top + window.pageYOffset;
                                                
                                                // scroll-mt를 고려한 정확한 스크롤 위치
                                                const scrollPosition = elementTop - scrollMargin;
                                                
                                                window.scrollTo({
                                                    top: Math.max(0, scrollPosition),
                                                    behavior: "smooth",
                                                });
                                            }
                                        }}
                                        className="p-2 text-[13px] text-lightest-slate hover:text-green transition-colors before:content-['0'attr(data-step)'.'] before:mr-2 before:text-green before:text-[12px]"
                                        data-step={i + 1}
                                    >
                                        {name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                    <a
                        href="/resume.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 text-[13px] text-green border border-green rounded hover:bg-green-tint transition-all"
                    >
                        이력서
                    </a>
                </div>

                {/* Mobile Menu Placeholder - Will be implemented in next step */}
                <div className="md:hidden">
                    <button className="text-green p-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                </div>
            </nav>
        </header>
    );
};
