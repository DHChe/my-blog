import { About } from "@/components/sections/About";
import { TIL } from "@/components/sections/TIL";
import { Reading } from "@/components/sections/Reading";
import { Project } from "@/components/sections/Project";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <>
      <About />
      <TIL />
      <Reading />
      <Project />

      <footer className="max-w-md pb-16 text-sm text-slate sm:pb-0 min-h-screen flex items-end">
        <p>
          본인은{" "}
          <a
            href="https://code.visualstudio.com/"
            className="font-medium text-slate hover:text-green focus-visible:text-green"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Visual Studio Code (새 탭에서 열기)"
          >
            Visual Studio Code
          </a>
          로 코딩하고,{" "}
          <a
            href="https://nextjs.org/"
            className="font-medium text-slate hover:text-green focus-visible:text-green"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Next.js (새 탭에서 열기)"
          >
            Next.js
          </a>
          와{" "}
          <a
            href="https://tailwindcss.com/"
            className="font-medium text-slate hover:text-green focus-visible:text-green"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Tailwind CSS (새 탭에서 열기)"
          >
            Tailwind CSS
          </a>
          를 사용하여 빌드했으며,{" "}
          <a
            href="https://vercel.com/"
            className="font-medium text-slate hover:text-green focus-visible:text-green"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Vercel (새 탭에서 열기)"
          >
            Vercel
          </a>
          을 통해 배포했습니다.
        </p>
      </footer>
    </>
  );
}
