<!--
=== Sync Impact Report ===
Version Change: 0.0.0 → 1.0.0
Bump Rationale: MAJOR - Initial constitution creation with core principles

Added Sections:
- Principle I: Test-First Development (TDD)
- Principle II: Documentation-First
- Principle III: Code Quality Standards
- Principle IV: Security-First
- Section: Development Workflow (GitHub Flow)
- Section: Testing Strategy (Test Pyramid)
- Section: Governance

Templates Status:
- .specify/templates/plan-template.md ✅ Compatible (Testing Strategy section exists)
- .specify/templates/spec-template.md ✅ Compatible (Security section exists)
- .specify/templates/tasks-template.md ✅ Compatible (Testing Tasks section exists)

Follow-up TODOs: None
-->

# My Portfolio Blog Constitution

## Core Principles

### I. Test-First Development (TDD)

테스트 주도 개발은 본 프로젝트의 핵심 원칙입니다.

- 모든 기능 구현 전 테스트를 먼저 작성해야 합니다 (MUST).
- Red-Green-Refactor 사이클을 엄격히 준수해야 합니다.
  1. **Red**: 실패하는 테스트 작성
  2. **Green**: 테스트를 통과하는 최소한의 코드 작성
  3. **Refactor**: 코드 품질 개선 (테스트 통과 유지)
- 테스트 없는 코드는 PR 승인이 불가합니다.
- 테스트 커버리지 목표: 백엔드 80% 이상, 프론트엔드 70% 이상

**Rationale**: TDD는 버그를 조기에 발견하고, 리팩토링 시 안전망을 제공하며, 설계 품질을 향상시킵니다.

### II. Documentation-First

문서화는 선택이 아닌 필수입니다.

- 모든 API 엔드포인트는 OpenAPI(Swagger) 스펙을 포함해야 합니다 (MUST).
- 공개 함수와 클래스는 docstring/JSDoc을 포함해야 합니다.
- README는 프로젝트 설정, 실행, 테스트 방법을 명확히 기술해야 합니다.
- 주요 아키텍처 결정은 ADR(Architecture Decision Record) 형식으로 기록해야 합니다.
- 변경 사항은 CHANGELOG에 기록해야 합니다.

**Rationale**: 문서화는 온보딩 시간을 단축하고, 유지보수성을 높이며, 포트폴리오로서의 가치를 증명합니다.

### III. Code Quality Standards

일관된 코드 품질을 유지합니다.

- 린터(ESLint, Ruff)와 포매터(Prettier, Black)를 필수로 적용합니다 (MUST).
- 모든 PR은 최소 1명의 코드 리뷰를 거쳐야 합니다 (개인 프로젝트의 경우 self-review 체크리스트 활용).
- 타입 안정성: TypeScript strict mode, Python type hints 필수
- 복잡도 제한: 함수당 순환 복잡도(Cyclomatic Complexity) 10 이하
- 코드 중복 최소화: DRY 원칙 준수

**Rationale**: 일관된 코드 스타일은 가독성을 높이고, 버그 발생 가능성을 줄입니다.

### IV. Security-First

보안은 모든 개발 단계에서 고려되어야 합니다.

- OWASP Top 10 취약점을 인지하고 방어해야 합니다 (MUST).
- 민감한 정보(API 키, 비밀번호)는 절대 코드에 하드코딩하지 않습니다.
- 환경 변수 또는 시크릿 매니저를 사용해야 합니다.
- 의존성 취약점 스캔을 CI/CD 파이프라인에 포함해야 합니다.
- 사용자 입력은 항상 검증하고 새니타이징해야 합니다.
- HTTPS 통신을 필수로 적용합니다.

**Rationale**: 보안 취약점은 프로젝트 신뢰도를 손상시키고, 포트폴리오로서의 가치를 떨어뜨립니다.

## Development Workflow

본 프로젝트는 GitHub Flow를 따릅니다.

### 브랜치 전략

```
main (protected)
  └── feature/[feature-name]
  └── fix/[bug-description]
  └── docs/[documentation-update]
```

### 워크플로우 규칙

1. `main` 브랜치는 항상 배포 가능한 상태를 유지합니다 (MUST).
2. 모든 작업은 `main`에서 분기한 feature 브랜치에서 수행합니다.
3. 작업 완료 후 Pull Request를 생성합니다.
4. CI 검사(테스트, 린트, 빌드)를 통과해야 병합할 수 있습니다.
5. PR 병합 후 feature 브랜치는 삭제합니다.

### 커밋 메시지 규칙

Conventional Commits 형식을 따릅니다:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Testing Strategy

테스트 피라미드 전략을 적용합니다.

### 테스트 계층

```
        ╱╲
       ╱  ╲       E2E Tests (10%)
      ╱────╲      - 핵심 사용자 시나리오
     ╱      ╲
    ╱────────╲    Integration Tests (20%)
   ╱          ╲   - API 엔드포인트, DB 연동
  ╱────────────╲
 ╱              ╲ Unit Tests (70%)
╱────────────────╲ - 함수, 컴포넌트 단위
```

### 프레임워크

| 영역 | 프레임워크 | 용도 |
|------|------------|------|
| 백엔드 단위 | pytest | FastAPI 함수, 유틸리티 테스트 |
| 백엔드 통합 | pytest + httpx | API 엔드포인트 테스트 |
| 프론트엔드 단위 | Jest + Testing Library | React 컴포넌트 테스트 |
| E2E | Playwright 또는 Cypress | 전체 사용자 플로우 테스트 |

### 테스트 실행 조건

- 모든 PR: 단위 테스트 + 통합 테스트
- main 브랜치 병합 시: 전체 테스트 (E2E 포함)
- 야간 빌드: 전체 테스트 + 성능 테스트

## Governance

### 헌법 우선 원칙

본 Constitution은 프로젝트의 모든 개발 관행보다 우선합니다. 충돌 시 Constitution을 따릅니다.

### 개정 절차

1. 개정 제안서 작성 (변경 사유, 영향 범위 포함)
2. 영향받는 문서 목록 식별
3. 버전 번호 결정:
   - **MAJOR**: 원칙 삭제 또는 근본적 변경
   - **MINOR**: 새 원칙 추가 또는 기존 원칙 확장
   - **PATCH**: 명확화, 오타 수정, 비의미적 변경
4. 관련 템플릿 및 문서 동기화
5. 변경 이력 기록

### 준수 검증

- 모든 PR은 Constitution 원칙 준수 여부를 확인해야 합니다.
- CI/CD 파이프라인에 자동화된 검증 단계를 포함합니다.
- 분기별 Constitution 리뷰를 수행하여 현실과의 괴리를 점검합니다.

**Version**: 1.0.0 | **Ratified**: 2025-12-21 | **Last Amended**: 2025-12-21
