'use client'

import React from "react";

export const About = () => {
    return (
        <section
            id="about"
            className="mb-16 scroll-mt-20 md:mb-24 md:scroll-mt-24 lg:mb-36 lg:scroll-mt-28"
            aria-label="소개"
        >
            <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-navy/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:hidden">
                <h2 className="text-sm font-bold uppercase tracking-widest text-lightest-slate">
                    소개
                </h2>
            </div>
            <div className="text-slate space-y-4">
                <div className="mb-6">
                    <img
                        src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop&q=80"
                        alt="백엔드 개발 일러스트레이션"
                        className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                    />
                </div>
                <p>
                    저는 기존에 HRM(인사관리) 및 인사노무 전반의 직무를 수행하며 현업에서의 실무 경력을 쌓아왔습니다. 그러다 급진적인 AI 기술의 발전과 함께 새로운 형태의 직무를 기획하고 실현하기 위해 개발자의 길을 병행하게 되었습니다.
                </p>
                <p>
                    오는 2025년 12월 29일부터는 <a
                        className="font-medium text-lightest-slate hover:text-green focus-visible:text-green"
                        href="https://ozcodingschool.com/"
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="오즈코딩스쿨 (새 탭에서 열기)"
                    >
                        오즈코딩스쿨
                    </a>의 <strong>'초격차-백엔드 과정'</strong> 부트캠프에 합류하여 본격적인 기술 역량을 강화할 예정입니다.
                </p>
                <p>
                    비전공자이지만 AI를 활용한 <strong>'바이브코딩(Vibe Coding)'</strong>을 통해 개발의 기반을 학습해 왔으며, 이제는 단순한 구현을 넘어 전문적인 백엔드 아키텍처를 직접 설계하고 견고한 시스템을 개발해보기 위해 이번 양성 과정을 선택하게 되었습니다.
                </p>
                <p>
                    저의 주된 관심사이자 목표는 인사노무 전반의 업무 프로세스에 <strong>AI Agent</strong>와 <strong>RAG(검색 증강 생성)</strong> 기술을 접목하여 효율적이고 혁신적인 솔루션을 기획하고 구축하는 것입니다.
                </p>
            </div>
        </section>
    );
};
