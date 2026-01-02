"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Github, Linkedin, Twitter, Instagram, CodepenIcon } from "lucide-react";

// 각 섹션의 scroll-mt 값 (lg 브레이크포인트 기준)
const SECTION_SCROLL_MARGINS: Record<string, { lg: number; md: number; base: number }> = {
    about: { lg: 28, md: 24, base: 20 },
    til: { lg: 96, md: 24, base: 20 },
    reading: { lg: 96, md: 24, base: 20 },
    project: { lg: 28, md: 24, base: 20 },
};

const navLinks = [
    { name: "소개", url: "#about" },
    { name: "TIL", url: "#til" },
    { name: "독서 노트", url: "#reading" },
    { name: "프로젝트", url: "#project" },
];

const socialLinks = [
    { name: "GitHub", icon: Github, url: "https://github.com" },
    { name: "LinkedIn", icon: Linkedin, url: "https://linkedin.com" },
    { name: "CodePen", icon: CodepenIcon, url: "https://codepen.io" },
    { name: "Instagram", icon: Instagram, url: "https://instagram.com" },
    { name: "Twitter", icon: Twitter, url: "https://twitter.com" },
];

export const LeftColumn = () => {
    const [activeSection, setActiveSection] = useState("");

    useEffect(() => {
        const handleScroll = () => {
            const sections = navLinks.map(link => link.url.replace("#", ""));
            const scrollPosition = window.scrollY + 100;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-1/2 lg:flex-col lg:py-24">
            <div>
                {/* Intro */}
                <div className="mb-8 lg:mb-0">
                    <h1 className="text-4xl font-bold tracking-tight text-lightest-slate sm:text-5xl">
                        <Link href="/">Astral Pig</Link>
                    </h1>
                    <h2 className="mt-3 text-lg font-medium tracking-tight text-lightest-slate sm:text-xl">
                        Backend Developer
                    </h2>
                    <p className="mt-4 max-w-xs leading-normal text-slate">
                        안정적이고 효율적인 서버 아키텍처를 설계하고, 확장 가능한 백엔드 시스템을 개발합니다.
                    </p>
                </div>

                {/* Navigation */}
                <nav className="nav hidden lg:block mt-16" aria-label="페이지 내 이동 링크">
                    <ul className="w-max">
                        {navLinks.map(({ name, url }) => (
                            <li key={name}>
                                <a
                                    href={url}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const targetId = url.replace("#", "");
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
                                    className={`group flex items-center py-3 ${activeSection === url.replace("#", "")
                                        ? "text-lightest-slate"
                                        : "text-slate"
                                        }`}
                                >
                                    <span
                                        className={`mr-4 h-px transition-all group-hover:w-16 group-hover:bg-lightest-slate group-focus-visible:w-16 group-focus-visible:bg-lightest-slate ${activeSection === url.replace("#", "")
                                            ? "w-16 bg-lightest-slate"
                                            : "w-8 bg-slate"
                                            }`}
                                    ></span>
                                    <span className="text-xs font-bold uppercase tracking-widest group-hover:text-lightest-slate group-focus-visible:text-lightest-slate">
                                        {name}
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Social Links - Added mt-auto to push to bottom on tall screens */}
            <ul className="ml-1 mt-8 lg:mt-auto flex items-center gap-5" aria-label="소셜 미디어">
                {socialLinks.map(({ name, icon: Icon, url }) => (
                    <li key={name} className="text-xs shrink-0">
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`${name} (새 탭에서 열기)`}
                            title={name}
                            className="block text-slate hover:text-lightest-slate transition-colors"
                        >
                            <span className="sr-only">{name}</span>
                            <Icon className="h-6 w-6" />
                        </a>
                    </li>
                ))}
            </ul>
        </header>
    );
};
