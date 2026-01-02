'use client'

import React from "react";
// import { ArrowUpRight, Star } from "lucide-react";

// 벤치마킹 레퍼런스 - 추후 참고용으로 주석 처리
// const projects = [
//     {
//         title: "Spotify 연결 앱 구축",
//         description:
//             "Spotify Web API를 사용하여 웹 앱을 구축하는 방법을 가르치는 영상 강의입니다. REST API의 원리, 사용자 인증 흐름, Node, Express, React, Styled Components 등의 주제를 다룹니다.",
//         image: "https://brittanychiang.com/_next/image?url=%2Fimages%2Fprojects%2Fcourse-card.png&w=256&q=75",
//         url: "https://www.newline.co/courses/build-a-spotify-connected-app",
//         skills: ["React", "Express", "Spotify API", "Heroku"],
//         stats: { stars: 0 },
//     },
//     {
//         title: "Halcyon 테마",
//         description:
//             "VS Code, Sublime Text, Atom, iTerm 등을 위한 미니멀한 다크 블루 테마입니다. Visual Studio Marketplace, Package Control, Atom Package Manager 및 npm에서 사용할 수 있습니다.",
//         image: "https://brittanychiang.com/_next/image?url=%2Fimages%2Fprojects%2Fhalcyon.png&w=256&q=75",
//         url: "https://halcyon-theme.netlify.app/",
//         skills: ["VS Code", "Sublime Text", "Atom", "iTerm2", "Hyper"],
//         stats: { stars: 700 },
//     },
//     {
//         title: "Spotify 프로필",
//         description:
//             "개인화된 Spotify 데이터를 시각화하는 웹 앱입니다. 최애 아티스트, 트랙, 최근 재생 목록 및 각 트랙의 상세 오디오 정보를 확인할 수 있습니다. 기존 재생 목록을 기반으로 추천 트랙의 새 재생 목록을 생성하고 저장하는 등의 기능을 제공합니다.",
//         image: "https://brittanychiang.com/_next/image?url=%2Fimages%2Fprojects%2Fspotify.png&w=256&q=75",
//         url: "https://spotify-profile.herokuapp.com/",
//         skills: ["React", "Styled Components", "Express", "Spotify API", "Heroku"],
//         stats: { stars: 0 },
//     },
// ];

export const Project = () => {
    return (
        <section
            id="project"
            className="mb-16 scroll-mt-20 md:mb-24 md:scroll-mt-24 lg:mb-36 lg:scroll-mt-28"
            aria-label="선택된 프로젝트"
        >
            <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-navy/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:hidden">
                <h2 className="text-sm font-bold uppercase tracking-widest text-lightest-slate">
                    프로젝트
                </h2>
            </div>
            <div>
                <div className="flex flex-col items-start py-12">
                    <div className="text-left space-y-2">
                        <p className="text-lg font-medium text-slate">
                            준비중입니다
                        </p>
                        <p className="text-sm text-slate/70">
                            부트캠프 진행 중 진행하게 되는 프로젝트들이 정리될 예정입니다.
                        </p>
                    </div>
                </div>
                {/* 벤치마킹 레퍼런스 - 추후 참고용으로 주석 처리
                <ul className="group/list">
                    {projects.map((project, i) => (
                        <li key={i} className="mb-12">
                            <div className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                                <div className="absolute -inset-x-4 -inset-y-4 z-0 rounded-md transition motion-reduce:transition-none md:-inset-x-6 opacity-0 group-hover:opacity-100 group-hover:bg-light-navy/50 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] group-hover:drop-shadow-lg"></div>
                                <div className="z-10 sm:order-2 sm:col-span-6">
                                    <h3>
                                        <a
                                            className="inline-flex items-baseline font-medium leading-tight text-lightest-slate hover:text-green focus-visible:text-green group/link text-base"
                                            href={project.url}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            aria-label={`${project.title} (새 탭에서 열기)`}
                                        >
                                            <span className="absolute -inset-x-4 -inset-y-2.5 rounded md:-inset-x-6 md:-inset-y-4 block"></span>
                                            <span>
                                                {project.title}
                                                <ArrowUpRight className="inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none ml-1 translate-y-px" />
                                            </span>
                                        </a>
                                    </h3>
                                    <p className="mt-2 text-sm leading-normal text-slate">
                                        {project.description}
                                    </p>
                                    {project.stats.stars > 0 && (
                                        <a
                                            className="relative mt-2 inline-flex items-center text-sm font-medium text-slate hover:text-green focus-visible:text-green"
                                            href={project.url}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            aria-label={`GitHub 스타 ${project.stats.stars}개 (새 탭에서 열기)`}
                                        >
                                            <Star className="mr-1 h-3 w-3" />
                                            <span>{project.stats.stars}</span>
                                        </a>
                                    )}
                                    <ul
                                        className="mt-2 flex flex-wrap"
                                        aria-label="사용 기술"
                                    >
                                        {project.skills.map((skill, j) => (
                                            <li key={j} className="mr-1.5 mt-2">
                                                <div className="flex items-center rounded-full bg-green-tint px-3 py-1 text-xs font-medium leading-5 text-green">
                                                    {skill}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="z-10 sm:order-1 sm:col-span-2 sm:translate-y-1">
                                    <div className="rounded border-2 border-transparent transition group-hover:border-light-navy/80 overflow-hidden">
                                        <img
                                            alt={project.title}
                                            loading="lazy"
                                            width="200"
                                            height="48"
                                            decoding="async"
                                            className="rounded"
                                            src={project.image}
                                        />
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-12">
                    <a
                        className="inline-flex items-baseline font-medium leading-tight text-lightest-slate hover:text-green focus-visible:text-green group/link text-base"
                        href="/archive"
                        aria-label="전체 프로젝트 아카이브 보기"
                    >
                        <span>
                            전체 프로젝트{" "}
                            <span className="inline-block">
                                아카이브 보기
                                <ArrowUpRight className="inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none ml-1 translate-y-px" />
                            </span>
                        </span>
                    </a>
                </div>
                */}
            </div>
        </section>
    );
};
