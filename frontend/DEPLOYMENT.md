# 프론트엔드 배포 가이드

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 설정하세요:

### 로컬 개발 환경

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 프로덕션 환경 (Vercel)

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```bash
# Backend API URL (프로덕션 백엔드 URL)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Site URL (프로덕션 프론트엔드 URL)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Vercel 배포

1. Vercel에 GitHub 리포지토리 연결
2. 프로젝트 설정에서 환경 변수 추가
3. 자동 배포 활성화

자세한 내용은 [프론트엔드 배포 가이드](../docs/frontend-deployment.md)를 참고하세요.

