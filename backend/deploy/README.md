# 배포 가이드

이 디렉토리에는 백엔드 배포에 필요한 설정 파일들이 포함되어 있습니다.

## 파일 설명

- `blog-api.service`: systemd 서비스 파일
- `nginx.conf`: Nginx 리버스 프록시 설정 파일

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 설정하세요:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/blog_db

# Admin API Key (temporary authentication)
ADMIN_API_KEY=your-secure-api-key

# Application
DEBUG=False

# CORS Settings
# Comma-separated list of allowed origins or JSON array
# 예: "https://yourdomain.com,https://www.yourdomain.com"
# 또는: '["https://yourdomain.com","https://www.yourdomain.com"]'
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# AI/LLM Settings (Phase 1 - Claude Only)
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## 배포 단계

1. EC2 인스턴스에 프로젝트 클론
2. `.env` 파일 생성 및 환경 변수 설정
3. systemd 서비스 파일 복사 및 활성화
4. Nginx 설정 파일 복사 및 활성화
5. SSL 인증서 발급

자세한 내용은 [백엔드 배포 가이드](../../docs/backend-deployment.md)를 참고하세요.

