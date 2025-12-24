# Next.js + Vercel 배포 가이드

## 개요

Next.js 블로그/포트폴리오 사이트를 Vercel에 배포하는 방법을 설명합니다.

## 기술 스택

- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **콘텐츠**: MDX (마크다운 + JSX)
- **배포**: Vercel

## 프로젝트 구조

```
my-blog/
├── app/                        # App Router
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈페이지
│   ├── blog/
│   │   ├── page.tsx            # 블로그 목록
│   │   └── [slug]/
│   │       └── page.tsx        # 블로그 상세
│   ├── projects/
│   │   ├── page.tsx            # 프로젝트 목록
│   │   └── [id]/
│   │       └── page.tsx        # 프로젝트 상세
│   └── about/
│       └── page.tsx            # 소개 페이지
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── blog/
│   │   ├── PostCard.tsx
│   │   └── PostContent.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
├── content/
│   └── posts/                  # MDX 블로그 포스트
├── lib/
│   ├── mdx.ts                  # MDX 파싱 유틸
│   └── api.ts                  # API 호출 유틸
├── public/
│   └── images/
├── styles/
│   └── globals.css
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local
└── .env.example
```

## Step 1: 프로젝트 초기화

```bash
# 현재 디렉토리에 Next.js 프로젝트 생성
cd /home/midiummin/projects/my-blog

npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

## Step 2: 필수 패키지 설치

```bash
# MDX 지원
npm install @next/mdx @mdx-js/loader @mdx-js/react

# 날짜 처리
npm install date-fns

# 코드 하이라이팅
npm install rehype-highlight rehype-slug

# 아이콘
npm install lucide-react

# SEO
npm install next-sitemap

# 타입 정의
npm install -D @types/mdx
```

## Step 3: Next.js 설정

### next.config.js

```javascript
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.yourdomain.com',
      },
    ],
  },
}

module.exports = withMDX(nextConfig)
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

## Step 4: 환경 변수 설정

### .env.example

```bash
# 백엔드 API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google Analytics (선택)
NEXT_PUBLIC_GA_ID=

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### .env.local (로컬 개발용)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 5: GitHub 리포지토리 연결

```bash
# Git 초기화 (이미 되어있다면 생략)
git init

# GitHub 리포지토리 연결
git remote add origin https://github.com/[username]/my-blog.git

# 첫 커밋 및 푸시
git add .
git commit -m "Initial Next.js setup"
git branch -M main
git push -u origin main
```

## Step 6: Vercel 배포

### 6.1 Vercel 프로젝트 생성

1. [vercel.com](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "Add New..." → "Project" 클릭
4. `my-blog` 리포지토리 선택
5. "Import" 클릭

### 6.2 빌드 설정 확인

| 설정 | 값 |
|------|-----|
| Framework Preset | Next.js (자동 감지) |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 6.3 환경 변수 설정

Vercel 대시보드 → Project Settings → Environment Variables:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` | Production |
| `NEXT_PUBLIC_API_URL` | `https://api-staging.yourdomain.com` | Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | Production |

### 6.4 배포

"Deploy" 버튼 클릭 → 자동 빌드 및 배포

## Step 7: 커스텀 도메인 설정 (선택)

### 7.1 Vercel 도메인 추가

1. Project Settings → Domains
2. 도메인 입력 (예: `blog.example.com`)
3. "Add" 클릭

### 7.2 DNS 레코드 설정

도메인 등록업체에서 다음 레코드 추가:

| Type | Name | Value |
|------|------|-------|
| CNAME | blog | cname.vercel-dns.com |

또는 루트 도메인의 경우:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |

### 7.3 SSL 인증서

Vercel이 자동으로 Let's Encrypt SSL 인증서를 발급합니다.

## 자동 배포 설정

Vercel은 기본적으로 다음 자동 배포를 제공합니다:

| 트리거 | 배포 환경 | URL |
|--------|-----------|-----|
| `main` 브랜치 푸시 | Production | `yourdomain.com` |
| PR 생성/업데이트 | Preview | `project-branch.vercel.app` |

## SEO 최적화

### next-sitemap.config.js

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
}
```

### package.json 스크립트 추가

```json
{
  "scripts": {
    "postbuild": "next-sitemap"
  }
}
```

## 트러블슈팅

### 빌드 실패 시

```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 에러 확인
npm run type-check

# 린트 에러 확인
npm run lint
```

### 환경 변수 문제

- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능
- Vercel에서 환경 변수 변경 후 재배포 필요

## 유용한 Vercel CLI 명령어

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 로컬에서 미리보기
vercel dev

# 프로덕션 배포
vercel --prod

# 환경 변수 가져오기
vercel env pull
```

## 관련 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Vercel 공식 문서](https://vercel.com/docs)
- [배포 전략 개요](./deployment-strategy.md)
