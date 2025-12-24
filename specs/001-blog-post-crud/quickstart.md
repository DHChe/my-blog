# Quickstart: Blog Post CRUD

**Feature**: 001-blog-post-crud
**Date**: 2025-12-21

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- pip (Python 패키지 관리자)

## 1. 환경 설정

### 1.1 저장소 클론 및 가상환경 생성

```bash
cd /home/midiummin/projects/my-blog
python3.11 -m venv venv
source venv/bin/activate  # Linux/macOS
# .\venv\Scripts\activate  # Windows
```

### 1.2 의존성 설치

```bash
pip install -r backend/requirements.txt
pip install -r backend/requirements-dev.txt  # 개발용 도구
```

### 1.3 환경 변수 설정

```bash
cp backend/.env.example backend/.env
```

`.env` 파일 편집:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/blog_db

# Admin API Key (임시 인증)
ADMIN_API_KEY=your-secure-api-key-here

# Application
DEBUG=true
```

## 2. 데이터베이스 설정

### 2.1 PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE blog_db;
\q
```

### 2.2 마이그레이션 실행

```bash
cd backend
alembic upgrade head
```

## 3. 서버 실행

### 개발 모드

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API 문서 접속

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 4. API 테스트

### 4.1 포스트 생성 (관리자)

```bash
curl -X POST http://localhost:8000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-here" \
  -d '{
    "title": "나의 첫 번째 블로그 포스트",
    "content": "# Hello World\n\n이것은 첫 번째 포스트입니다.",
    "status": "published",
    "tags": ["Python", "FastAPI"]
  }'
```

**예상 응답** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "나의 첫 번째 블로그 포스트",
  "slug": "naeui-cheot-beonjjae-beullogeu-poseuteu",
  "content": "# Hello World\n\n이것은 첫 번째 포스트입니다.",
  "status": "published",
  "created_at": "2025-12-21T12:00:00Z",
  "updated_at": null,
  "published_at": "2025-12-21T12:00:00Z",
  "tags": [
    {"id": "...", "name": "Python", "slug": "python"},
    {"id": "...", "name": "FastAPI", "slug": "fastapi"}
  ]
}
```

### 4.2 포스트 목록 조회 (공개)

```bash
curl http://localhost:8000/api/v1/posts
```

**예상 응답** (200 OK):

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "나의 첫 번째 블로그 포스트",
      "slug": "naeui-cheot-beonjjae-beullogeu-poseuteu",
      "status": "published",
      "created_at": "2025-12-21T12:00:00Z",
      "excerpt": "# Hello World\n\n이것은 첫 번째 포스트입니다.",
      "tags": [...]
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

### 4.3 포스트 상세 조회 (공개)

```bash
curl http://localhost:8000/api/v1/posts/naeui-cheot-beonjjae-beullogeu-poseuteu
```

### 4.4 포스트 수정 (관리자)

```bash
curl -X PUT http://localhost:8000/api/v1/posts/naeui-cheot-beonjjae-beullogeu-poseuteu \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-here" \
  -d '{
    "title": "수정된 제목",
    "content": "# 업데이트된 내용"
  }'
```

### 4.5 포스트 삭제 (관리자)

```bash
curl -X DELETE http://localhost:8000/api/v1/posts/naeui-cheot-beonjjae-beullogeu-poseuteu \
  -H "X-API-Key: your-secure-api-key-here"
```

**예상 응답**: 204 No Content

## 5. 테스트 실행

### 전체 테스트

```bash
cd backend
pytest tests/ -v
```

### 커버리지 리포트

```bash
pytest tests/ --cov=app --cov-report=html
# 리포트: htmlcov/index.html
```

### 단위 테스트만

```bash
pytest tests/unit/ -v
```

### 통합 테스트만

```bash
pytest tests/integration/ -v
```

## 6. 코드 품질 검사

### 린터 실행

```bash
ruff check app/
```

### 포매터 실행

```bash
black app/
```

### 타입 검사

```bash
mypy app/
```

## 7. 트러블슈팅

### 데이터베이스 연결 오류

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**해결**: PostgreSQL 서비스 실행 확인

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### 마이그레이션 오류

```
alembic.util.exc.CommandError: Can't locate revision identified by '...'
```

**해결**: 마이그레이션 초기화

```bash
alembic downgrade base
alembic upgrade head
```

### 인증 오류

```json
{"detail": "Invalid or missing API key"}
```

**해결**: `.env`의 `ADMIN_API_KEY` 값과 요청 헤더의 `X-API-Key` 일치 확인

## 8. 다음 단계

1. **프론트엔드 연동**: Next.js에서 이 API 호출
2. **인증 시스템**: JWT 기반 인증으로 교체
3. **이미지 업로드**: S3 연동 구현
4. **댓글 기능**: 별도 기능으로 구현

## 관련 문서

- [API 스펙 (OpenAPI)](./contracts/openapi.yaml)
- [데이터 모델](./data-model.md)
- [기술 리서치](./research.md)
