import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface TILPageWrapperProps {
    children: React.ReactNode;
    showBackLink?: boolean;
    backLinkHref?: string;
    backLinkText?: string;
}

export const TILPageWrapper = ({
    children,
    showBackLink = true,
    backLinkHref = "/",
    backLinkText = "홈으로",
}: TILPageWrapperProps) => {
    return (
        <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 md:px-12 md:py-20 lg:px-24 lg:py-24">
            {/* Navigation Header */}
            <header className="mb-12">
                {showBackLink && (
                    <Link
                        href={backLinkHref}
                        className="group mb-2 inline-flex items-center font-semibold leading-tight text-green"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>{backLinkText}</span>
                    </Link>
                )}
                <h1 className="text-4xl font-bold tracking-tight text-lightest-slate sm:text-5xl">
                    TIL - Today I Learned
                </h1>
                <p className="mt-4 max-w-xl text-lg text-slate">
                    오늘 학습한 내용을 기록하는 공간입니다.
                </p>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
};

