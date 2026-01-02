import type { Metadata } from "next";
import "./globals.css";
import { SpotlightCursor } from "@/components/layout/SpotlightCursor";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import React from "react";

export const metadata: Metadata = {
  title: "개발 블로그 | Brittany Chiang Copy",
  description: "Next.js 16과 Tailwind CSS v4로 구축한 포트폴리오 블로그입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased leading-relaxed text-slate selection:bg-green-tint selection:text-green">
        <div id="root" className="relative">
          <SpotlightCursor />
          <ConditionalLayout>{children}</ConditionalLayout>
        </div>
      </body>
    </html>
  );
}
