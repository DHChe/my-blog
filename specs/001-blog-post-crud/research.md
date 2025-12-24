# Research: Blog Post CRUD

**Feature**: 001-blog-post-crud
**Date**: 2025-12-21
**Status**: Complete

## 1. Slug 생성 전략

### Decision
`python-slugify` 라이브러리를 사용하여 한글/영문 제목에서 URL-safe slug를 생성합니다.

### Rationale
- 한글 제목을 영문 slug로 변환 (transliteration 지원)
- 특수문자 제거 및 공백을 하이픈으로 변환
- 중복 slug 처리: `{slug}-{n}` 형식으로 suffix 추가 (예: `my-post-2`)
- 유니코드 정규화 지원

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| python-slugify | 한글 지원, 경량 | 외부 의존성 | ✅ 선택 |
| slugify (unicode) | 유니코드 보존 | SEO 불리 | ❌ |
| 직접 구현 | 의존성 없음 | 엣지케이스 처리 복잡 | ❌ |

### Implementation Notes
```python
from slugify import slugify

def generate_slug(title: str, existing_slugs: list[str]) -> str:
    base_slug = slugify(title, lowercase=True, max_length=100)
    slug = base_slug
    counter = 1
    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug
```

---

## 2. Post 상태 관리

### Decision
Enum 기반 상태 관리: `draft`, `published`

### Rationale
- 단순한 2-상태 모델로 충분 (단일 관리자 운영)
- 추후 `archived`, `scheduled` 등 확장 가능
- SQLAlchemy Enum 타입으로 DB 제약조건 보장

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Enum (draft/published) | 단순, 명확 | 확장 시 마이그레이션 필요 | ✅ 선택 |
| Boolean (is_published) | 매우 단순 | 상태 확장 불가 | ❌ |
| 상태 머신 | 복잡한 워크플로우 지원 | 과도한 복잡성 | ❌ |

---

## 3. 페이지네이션 전략

### Decision
Offset-based 페이지네이션 + 총 개수 반환

### Rationale
- 포스트 수가 적음 (100-500개 예상)
- 클라이언트에서 페이지 번호 표시 필요
- 구현 단순성

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Offset-based | 단순, 페이지 번호 지원 | 대량 데이터 시 성능 저하 | ✅ 선택 |
| Cursor-based | 대량 데이터 효율적 | 페이지 번호 불가, 구현 복잡 | ❌ |

### Implementation Notes
```python
@router.get("/posts")
async def list_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: PostStatus | None = None,
) -> PostListResponse:
    # total과 items 반환
    pass
```

---

## 4. Tag 관계 설계

### Decision
다대다 관계 (association table) + 태그 자동 생성

### Rationale
- 하나의 포스트에 여러 태그, 하나의 태그에 여러 포스트
- 존재하지 않는 태그는 자동 생성 (사용자 편의성)
- 사용되지 않는 태그는 유지 (삭제 시 복잡성 증가)

### Implementation Notes
```python
# Association table
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)
```

---

## 5. Soft Delete vs Hard Delete

### Decision
Hard Delete (명세서 Assumptions에 따름)

### Rationale
- 명세서에서 명시적으로 hard delete 요구
- 단일 관리자 운영으로 실수 복구 필요성 낮음
- 삭제 전 확인 다이얼로그로 안전장치 제공

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Hard Delete | 단순, 데이터 정리 불필요 | 복구 불가 | ✅ 선택 (명세서 요구) |
| Soft Delete | 복구 가능 | 쿼리 복잡, 데이터 누적 | ❌ |

---

## 6. 인증 통합 (임시)

### Decision
관리자 인증은 별도 기능으로 구현 예정. 현재는 간단한 API Key 기반 인증 스텁 사용.

### Rationale
- 명세서에서 인증 시스템은 별도 기능으로 분리됨
- CRUD 기능 테스트를 위한 임시 인증 필요
- 추후 JWT/Session 기반 인증으로 교체 예정

### Implementation Notes
```python
# 임시 인증 (추후 교체)
async def get_current_admin(
    api_key: str = Header(..., alias="X-API-Key")
) -> bool:
    if api_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True
```

---

## 7. 에러 응답 표준화

### Decision
RFC 7807 Problem Details 형식 사용

### Rationale
- 표준화된 에러 응답 형식
- FastAPI HTTPException과 호환
- 클라이언트에서 일관된 에러 처리 가능

### Implementation Notes
```python
{
    "type": "https://example.com/errors/validation",
    "title": "Validation Error",
    "status": 422,
    "detail": "Title is required",
    "instance": "/api/v1/posts"
}
```

---

## 8. 테스트 전략

### Decision
테스트 피라미드 준수: Unit 70%, Integration 20%, E2E 10%

### Rationale
- Constitution 요구사항 (TDD, 80% 커버리지)
- 빠른 피드백을 위한 단위 테스트 중심
- API 통합 테스트로 엔드포인트 검증

### Test Categories
| Category | Target | Tools |
|----------|--------|-------|
| Unit | slug 생성, 유효성 검사, CRUD 로직 | pytest |
| Integration | API 엔드포인트, DB 연동 | pytest + httpx + TestClient |
| Contract | OpenAPI 스펙 일치 | schemathesis (선택) |

---

## Summary

모든 기술적 결정이 완료되었습니다. Constitution Check를 통과했으며, Phase 1 설계로 진행 가능합니다.

| Topic | Decision |
|-------|----------|
| Slug 생성 | python-slugify, 중복 시 suffix 추가 |
| 상태 관리 | Enum (draft/published) |
| 페이지네이션 | Offset-based + total count |
| Tag 관계 | Many-to-Many, 자동 생성 |
| 삭제 방식 | Hard Delete |
| 인증 | 임시 API Key (추후 교체) |
| 에러 응답 | RFC 7807 형식 |
| 테스트 | pytest, 80% 커버리지 목표 |
