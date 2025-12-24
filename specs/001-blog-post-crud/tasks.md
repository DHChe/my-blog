<h1 align="center">Tasks: Blog Post CRUD</h1>

<p align="center">

**Input**: Design documents from `/specs/001-blog-post-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Strategy**: TDD (테스트 먼저 작성 후 구현)
**Scope**: 전체 CRUD (US1-US4)
**Task Size**: 세분화 (파일 단위)

</p>

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 User Story (US1, US2, US3, US4)

---

## Phase 1: Setup (프로젝트 초기 설정)

**Purpose**: 프로젝트 구조 및 개발 환경 설정

- [x] T001 [P] backend/ 디렉토리 구조 생성 (app/, tests/, alembic/)
- [x] T002 [P] pyproject.toml 생성 (ruff, black, pytest, mypy 설정)
- [x] T003 [P] requirements.txt 생성 (FastAPI, SQLAlchemy, Pydantic, etc.)
- [x] T004 [P] requirements-dev.txt 생성 (pytest, httpx, pytest-asyncio, etc.)
- [x] T005 [P] .env.example 생성 (DATABASE_URL, ADMIN_API_KEY, DEBUG)

**Checkpoint**: `pip install -r requirements.txt` 성공 확인

---

## Phase 2: Foundational (핵심 인프라)

**Purpose**: 모든 User Story가 의존하는 기반 코드

**⚠️ CRITICAL**: 이 Phase 완료 전까지 User Story 구현 불가

### 2.1 데이터베이스 설정

- [x] T006 backend/app/db/base.py 생성 (SQLAlchemy Base 클래스)
- [x] T007 backend/app/db/session.py 생성 (AsyncSession, get_db 의존성)
- [x] T008 backend/app/config.py 생성 (Settings with pydantic-settings)

### 2.2 모델 정의

- [x] T009 [P] backend/app/models/__init__.py 생성
- [x] T010 backend/app/models/post.py 생성 (Post, PostStatus 모델)
- [x] T011 backend/app/models/tag.py 생성 (Tag, post_tags association table)

### 2.3 마이그레이션 설정

- [x] T012 alembic init 실행 및 alembic.ini 설정
- [x] T013 backend/alembic/env.py 수정 (async 지원, Base.metadata 연결)
- [x] T014 첫 번째 마이그레이션 생성 (posts, tags, post_tags 테이블)

### 2.4 앱 기본 구조

- [x] T015 backend/app/__init__.py 생성
- [x] T016 backend/app/main.py 생성 (FastAPI app, lifespan, CORS)
- [x] T017 backend/app/api/__init__.py 생성
- [x] T018 backend/app/api/deps.py 생성 (get_db, get_current_admin 의존성)
- [x] T019 backend/app/api/v1/__init__.py 생성
- [x] T020 backend/app/api/v1/router.py 생성 (APIRouter 통합)

### 2.5 유틸리티

- [x] T021 backend/app/utils/__init__.py 생성
- [x] T022 backend/app/utils/slug.py 생성 (generate_slug 함수 with python-slugify)

### 2.6 테스트 인프라

- [x] T023 [P] backend/tests/__init__.py 생성
- [x] T024 backend/tests/conftest.py 생성 (TestClient, async DB fixtures)

**Checkpoint**: `uvicorn app.main:app --reload` 실행 및 /docs 접속 확인

---

## Phase 3: User Story 1 - 포스트 조회 (Priority: P1) 🎯 MVP

**Goal**: 방문자가 공개된 포스트 목록과 상세 내용을 볼 수 있음

**Independent Test**: `GET /api/v1/posts` 및 `GET /api/v1/posts/{slug}` 응답 확인

### 3.1 Tests for US1 (TDD - 먼저 작성) ⚠️

> **NOTE**: 테스트 먼저 작성하고 FAIL 확인 후 구현 진행

- [x] T025 [P] [US1] backend/tests/unit/__init__.py 생성
- [x] T026 [P] [US1] backend/tests/unit/test_slug.py 생성 (slug 생성 단위 테스트)
- [x] T027 [P] [US1] backend/tests/integration/__init__.py 생성
- [x] T028 [US1] backend/tests/integration/test_posts_read.py 생성
  - test_list_posts_empty: 빈 목록 반환
  - test_list_posts_with_data: 포스트 목록 조회
  - test_list_posts_pagination: 페이지네이션 동작
  - test_list_posts_only_published: draft 제외 확인
  - test_get_post_by_slug: 상세 조회
  - test_get_post_not_found: 404 응답

### 3.2 Implementation for US1

- [x] T029 backend/app/schemas/__init__.py 생성
- [x] T030 [US1] backend/app/schemas/post.py 생성 (PostResponse, PostListItem, PostListResponse)
- [x] T031 backend/app/crud/__init__.py 생성
- [x] T032 [US1] backend/app/crud/post.py 생성 (get_posts, get_post_by_slug)
- [x] T033 [US1] backend/app/api/v1/endpoints/__init__.py 생성
- [x] T034 [US1] backend/app/api/v1/endpoints/posts.py 생성 (GET /posts, GET /posts/{slug})
- [x] T035 [US1] router.py에 posts 라우터 등록

**Checkpoint**: `pytest tests/integration/test_posts_read.py -v` 모두 PASS

---

## Phase 4: User Story 2 - 포스트 생성 (Priority: P2)

**Goal**: 관리자가 새 포스트를 생성하고 저장할 수 있음

**Independent Test**: `POST /api/v1/posts` with valid API key → 201 Created

### 4.1 Tests for US2 (TDD - 먼저 작성) ⚠️

- [x] T036 [US2] backend/tests/integration/test_posts_create.py 생성
  - test_create_post_success: 포스트 생성 성공
  - test_create_post_with_tags: 태그 포함 생성
  - test_create_post_draft: 초안 상태 생성
  - test_create_post_auto_slug: slug 자동 생성
  - test_create_post_duplicate_slug: 중복 slug 처리
  - test_create_post_validation_error: 유효성 검사 실패
  - test_create_post_unauthorized: API key 없음 → 401

### 4.2 Implementation for US2

- [x] T037 [US2] backend/app/schemas/post.py에 PostCreate 스키마 추가
- [x] T038 [US2] backend/app/crud/post.py에 create_post 함수 추가
- [x] T039 [US2] backend/app/api/v1/endpoints/posts.py에 POST /posts 엔드포인트 추가

**Checkpoint**: `pytest tests/integration/test_posts_create.py -v` 모두 PASS

---

## Phase 5: User Story 3 - 포스트 수정 (Priority: P3)

**Goal**: 관리자가 기존 포스트를 수정할 수 있음

**Independent Test**: `PUT /api/v1/posts/{slug}` with valid API key → 200 OK

### 5.1 Tests for US3 (TDD - 먼저 작성) ⚠️

- [x] T040 [US3] backend/tests/integration/test_posts_update.py 생성
  - test_update_post_title: 제목 수정
  - test_update_post_content: 본문 수정
  - test_update_post_status: 상태 변경 (draft ↔ published)
  - test_update_post_tags: 태그 수정
  - test_update_post_updated_at: 수정 일시 기록 확인
  - test_update_post_not_found: 404 응답
  - test_update_post_unauthorized: API key 없음 → 401

### 5.2 Implementation for US3

- [x] T041 [US3] backend/app/schemas/post.py에 PostUpdate 스키마 추가
- [x] T042 [US3] backend/app/crud/post.py에 update_post 함수 추가
- [x] T043 [US3] backend/app/api/v1/endpoints/posts.py에 PUT /posts/{slug} 엔드포인트 추가

**Checkpoint**: `pytest tests/integration/test_posts_update.py -v` 모두 PASS

---

## Phase 6: User Story 4 - 포스트 삭제 (Priority: P4)

**Goal**: 관리자가 포스트를 영구 삭제할 수 있음

**Independent Test**: `DELETE /api/v1/posts/{slug}` with valid API key → 204 No Content

### 6.1 Tests for US4 (TDD - 먼저 작성) ⚠️

- [x] T044 [US4] backend/tests/integration/test_posts_delete.py 생성
  - test_delete_post_success: 포스트 삭제 성공
  - test_delete_post_not_found: 404 응답
  - test_delete_post_unauthorized: API key 없음 → 401
  - test_deleted_post_not_in_list: 삭제 후 목록에서 제거 확인

### 6.2 Implementation for US4

- [x] T045 [US4] backend/app/crud/post.py에 delete_post 함수 추가
- [x] T046 [US4] backend/app/api/v1/endpoints/posts.py에 DELETE /posts/{slug} 엔드포인트 추가

**Checkpoint**: `pytest tests/integration/test_posts_delete.py -v` 모두 PASS

---

## Phase 7: Tags API (보조 기능)

**Goal**: 태그 목록 조회 API 제공

- [x] T047 [P] backend/app/schemas/tag.py 생성 (TagResponse)
- [x] T048 [P] backend/tests/integration/test_tags.py 생성
  - test_list_tags_empty: 빈 목록
  - test_list_tags_with_data: 태그 목록 조회
- [x] T049 backend/app/crud/tag.py 생성 (get_tags)
- [x] T050 backend/app/api/v1/endpoints/tags.py 생성 (GET /tags)
- [x] T051 router.py에 tags 라우터 등록

**Checkpoint**: `pytest tests/integration/test_tags.py -v` 모두 PASS

---

## Phase 8: Polish & Validation (마무리)

**Purpose**: 코드 품질 검사 및 최종 검증

- [x] T052 [P] ruff check backend/app/ 실행 및 오류 수정
- [x] T053 [P] black backend/app/ 실행 (코드 포맷팅)
- [x] T054 [P] mypy backend/app/ 실행 및 타입 오류 수정
- [x] T055 pytest tests/ --cov=app --cov-report=term-missing 실행 (75% 커버리지 달성)
- [x] T056 quickstart.md 검증 (수동 API 테스트) ✅ SQLite 호환성 수정 후 검증 완료

**Checkpoint**: 모든 품질 검사 통과, 80% 이상 테스트 커버리지 ✅ COMPLETE

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
Phase 3 (US1: Read) → MVP 가능!
    ↓
Phase 4 (US2: Create)
    ↓
Phase 5 (US3: Update)
    ↓
Phase 6 (US4: Delete)
    ↓
Phase 7 (Tags API) ← 병렬 가능 (Phase 2 완료 후)
    ↓
Phase 8 (Polish)
```

### Within Each User Story (TDD Flow)

1. **테스트 작성** → 테스트 FAIL 확인
2. **스키마 구현** → 데이터 구조 정의
3. **CRUD 구현** → 비즈니스 로직
4. **엔드포인트 구현** → API 노출
5. **테스트 PASS 확인** → 완료

### Parallel Opportunities

- Phase 1: T001-T005 모두 병렬 가능
- Phase 2: T009, T023 병렬 가능
- Phase 3.1: T025-T027 병렬 가능
- Phase 7-8: Phase 6 완료 후 병렬 가능

---

## Task Summary

| Phase | Tasks | 예상 작업 |
|-------|-------|----------|
| Phase 1 | T001-T005 | 프로젝트 구조 |
| Phase 2 | T006-T024 | 기반 인프라 |
| Phase 3 | T025-T035 | 조회 기능 (TDD) |
| Phase 4 | T036-T039 | 생성 기능 (TDD) |
| Phase 5 | T040-T043 | 수정 기능 (TDD) |
| Phase 6 | T044-T046 | 삭제 기능 (TDD) |
| Phase 7 | T047-T051 | 태그 API |
| Phase 8 | T052-T056 | 품질 검사 |

**Total**: 56 tasks
