# 프로젝트 실행 메뉴얼

이 문서는 블로그 프로젝트를 로컬 환경에서 실행하는 방법을 안내합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [백엔드 서버 실행](#백엔드-서버-실행)
4. [프론트엔드 서버 실행](#프론트엔드-서버-실행)
5. [접속 주소](#접속-주소)
6. [문제 해결](#문제-해결)

---

## 사전 요구사항

다음 소프트웨어가 설치되어 있어야 합니다:

- **Python 3.11 이상**
- **Node.js 18 이상** 및 **npm**
- **PostgreSQL 12 이상**
- **Git**

### 설치 확인

```bash
# Python 버전 확인
python3 --version

# Node.js 버전 확인
node --version

# npm 버전 확인
npm --version

# PostgreSQL 버전 확인
psql --version
```

---

## 데이터베이스 설정

### 1. PostgreSQL 데이터베이스 생성

PostgreSQL에 접속하여 데이터베이스를 생성합니다:

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE blog_db;

# 사용자 권한 설정 (필요한 경우)
GRANT ALL PRIVILEGES ON DATABASE blog_db TO postgres;

# PostgreSQL 종료
\q
```

### 2. 환경 변수 설정

백엔드 디렉토리에 `.env` 파일을 생성합니다:

```bash
cd backend
touch .env
```

`.env` 파일에 다음 내용을 추가합니다:

```env
# 데이터베이스 연결 정보
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/blog_db

# 관리자 API 키 (개발 환경용)
ADMIN_API_KEY=dev-api-key

# 디버그 모드 (개발 시 true로 설정)
DEBUG=True
```

> **참고**: `DATABASE_URL`의 형식은 `postgresql+asyncpg://사용자명:비밀번호@호스트:포트/데이터베이스명`입니다.
> 
> 예시:
> - 사용자명: `postgres`
> - 비밀번호: `your_password`
> - 호스트: `localhost`
> - 포트: `5432`
> - 데이터베이스명: `blog_db`
> 
> 위 정보에 맞게 `DATABASE_URL`을 수정하세요.

---

## 백엔드 서버 실행

백엔드 서버 실행은 **초기 설정(처음 한 번만)**과 **일상적인 실행(매번)**으로 나뉩니다.

---

### 🔧 초기 설정 (처음 한 번만 실행)

프로젝트를 처음 시작하거나 새로 클론받았을 때만 실행합니다.

#### 1단계: 가상 환경 생성

```bash
# 백엔드 디렉토리로 이동
cd backend

# 가상 환경 생성 (이미 venv 폴더가 있으면 생략 가능)
python3 -m venv venv
```

> **💡 팁**: `venv` 폴더가 이미 존재한다면 이 단계는 건너뛰어도 됩니다.

#### 2단계: 가상 환경 활성화

```bash
# macOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate
```

가상 환경이 활성화되면 터미널 앞에 `(venv)`가 표시됩니다.

#### 3단계: 의존성 설치 (처음 한 번만)

```bash
# 필요한 패키지들을 설치합니다
pip install -r requirements.txt
```

> **⚠️ 중요**: 이 단계는 **처음 한 번만** 실행하면 됩니다. 
> - `requirements.txt` 파일이 변경되었을 때만 다시 실행하세요
> - 새로운 패키지가 추가되었을 때만 다시 실행하세요

#### 4단계: 데이터베이스 마이그레이션 (처음 한 번만)

```bash
# 데이터베이스 테이블을 생성합니다
alembic upgrade head
```

> **⚠️ 중요**: 이 단계도 **처음 한 번만** 실행하면 됩니다.
> - 데이터베이스 스키마가 변경되었을 때만 다시 실행하세요
> - 다른 개발자가 데이터베이스 구조를 변경했을 때만 다시 실행하세요

---

### 🚀 일상적인 서버 실행 (매번 실행)

개발을 시작할 때마다 실행하는 단계입니다.

#### 1단계: 백엔드 디렉토리로 이동

```bash
cd backend
```

#### 2단계: 가상 환경 활성화

```bash
# macOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate
```

> **💡 팁**: 가상 환경이 활성화되면 터미널 앞에 `(venv)`가 표시됩니다.

#### 3단계: 서버 실행

```bash
# 개발 모드로 실행 (코드 변경 시 자동 재시작)
uvicorn app.main:app --reload
```

서버가 성공적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

> **✅ 완료**: 백엔드 서버가 실행되었습니다! 
> - API 문서: http://localhost:8000/docs
> - Health Check: http://localhost:8000/health

---

### 📝 요약: 언제 무엇을 실행하나요?

| 작업 | 실행 시기 | 빈도 |
|------|----------|------|
| 가상 환경 생성 | 프로젝트를 처음 시작할 때 | 처음 한 번만 |
| 가상 환경 활성화 | 서버를 실행할 때마다 | **매번** |
| 의존성 설치 | `requirements.txt`가 변경되었을 때 | 필요할 때만 |
| 데이터베이스 마이그레이션 | 데이터베이스 구조가 변경되었을 때 | 필요할 때만 |
| 서버 실행 | 개발을 시작할 때마다 | **매번** |

**일상적인 개발 흐름**:
1. `cd backend` (백엔드 디렉토리로 이동)
2. `source venv/bin/activate` (가상 환경 활성화)
3. `uvicorn app.main:app --reload` (서버 실행)

끝! 이 세 가지만 실행하면 됩니다! 🎉

---

## 프론트엔드 서버 실행

프론트엔드 서버 실행도 **초기 설정(처음 한 번만)**과 **일상적인 실행(매번)**으로 나뉩니다.

---

### 🔧 초기 설정 (처음 한 번만 실행)

프로젝트를 처음 시작하거나 새로 클론받았을 때만 실행합니다.

#### 1단계: 의존성 설치 (처음 한 번만)

새 터미널 창을 열고:

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 필요한 패키지들을 설치합니다
npm install
```

> **⚠️ 중요**: 이 단계는 **처음 한 번만** 실행하면 됩니다.
> - `package.json` 파일이 변경되었을 때만 다시 실행하세요
> - 새로운 패키지가 추가되었을 때만 다시 실행하세요
> - `node_modules` 폴더가 삭제되었을 때만 다시 실행하세요

#### 2단계: 환경 변수 설정 (선택사항)

프론트엔드에서 백엔드 API URL을 변경하려면 `.env.local` 파일을 생성합니다:

```bash
cd frontend
touch .env.local
```

`.env.local` 파일에 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> **💡 참고**: 
> - 기본값은 `http://localhost:8000/api/v1`이므로 백엔드가 기본 포트(8000)에서 실행 중이라면 이 단계는 생략 가능합니다
> - 한 번 설정하면 계속 사용되므로 매번 설정할 필요 없습니다

---

### 🚀 일상적인 서버 실행 (매번 실행)

개발을 시작할 때마다 실행하는 단계입니다.

#### 1단계: 프론트엔드 디렉토리로 이동

```bash
cd frontend
```

#### 2단계: 개발 서버 실행

```bash
# 개발 모드로 실행 (코드 변경 시 자동 새로고침)
npm run dev
```

서버가 성공적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
  ▲ Next.js 16.1.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in X.XXs
```

> **✅ 완료**: 프론트엔드 서버가 실행되었습니다!
> - 메인 페이지: http://localhost:3000

---

### 📝 요약: 언제 무엇을 실행하나요?

| 작업 | 실행 시기 | 빈도 |
|------|----------|------|
| 의존성 설치 (`npm install`) | `package.json`이 변경되었을 때 | 필요할 때만 |
| 환경 변수 설정 | 백엔드 URL을 변경할 때 | 필요할 때만 |
| 서버 실행 (`npm run dev`) | 개발을 시작할 때마다 | **매번** |

**일상적인 개발 흐름**:
1. `cd frontend` (프론트엔드 디렉토리로 이동)
2. `npm run dev` (서버 실행)

끝! 이 두 가지만 실행하면 됩니다! 🎉

---

## 접속 주소

### 프론트엔드 (메인 애플리케이션)

- **로컬 접속**: http://localhost:3000
- **네트워크 접속**: http://[본인의-IP-주소]:3000

#### 주요 페이지

- **홈**: http://localhost:3000
- **About**: http://localhost:3000/about
- **Projects**: http://localhost:3000/projects
- **TIL (Today I Learned)**: http://localhost:3000/til
- **TIL 상세 페이지**: http://localhost:3000/til/[slug]
- **관리자 페이지**: http://localhost:3000/admin
- **관리자 로그인**: http://localhost:3000/admin/login

### 백엔드 API

- **API 기본 URL**: http://localhost:8000/api/v1
- **API 문서 (Swagger UI)**: http://localhost:8000/docs
- **API 문서 (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

#### 주요 API 엔드포인트

- **TIL 목록 조회**: `GET /api/v1/tils`
  - 쿼리 파라미터: `page`, `size`, `tag`, `published`
  - 예시: http://localhost:8000/api/v1/tils?page=1&size=10&published=true

- **TIL 상세 조회**: `GET /api/v1/tils/{slug}`
  - 예시: http://localhost:8000/api/v1/tils/my-first-post

- **태그 목록 조회**: `GET /api/v1/tags`
  - 예시: http://localhost:8000/api/v1/tags

- **TIL 생성**: `POST /api/v1/tils` (관리자 전용)
- **TIL 수정**: `PUT /api/v1/tils/{id}` (관리자 전용)
- **TIL 삭제**: `DELETE /api/v1/tils/{id}` (관리자 전용)

> **참고**: 관리자 전용 API는 `X-API-Key` 헤더에 `ADMIN_API_KEY` 값을 포함해야 합니다.

---

## 문제 해결

### 백엔드 관련

#### 데이터베이스 연결 오류

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**해결 방법**:
1. PostgreSQL이 실행 중인지 확인:
   ```bash
   # macOS (Homebrew)
   brew services list
   # 또는
   pg_isready
   ```

2. `.env` 파일의 `DATABASE_URL`이 올바른지 확인
3. 데이터베이스가 존재하는지 확인:
   ```bash
   psql -U postgres -l
   ```

#### 포트가 이미 사용 중

```
ERROR:    [Errno 48] Address already in use
```

**해결 방법**:
1. 다른 포트로 실행:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
2. 또는 기존 프로세스 종료:
   ```bash
   # 포트 8000을 사용하는 프로세스 찾기
   lsof -ti:8000
   # 프로세스 종료
   kill -9 $(lsof -ti:8000)
   ```

#### 마이그레이션 오류

**해결 방법**:
1. 마이그레이션 상태 확인:
   ```bash
   alembic current
   ```

2. 특정 버전으로 롤백:
   ```bash
   alembic downgrade -1
   ```

3. 다시 마이그레이션:
   ```bash
   alembic upgrade head
   ```

### 프론트엔드 관련

#### 포트가 이미 사용 중

**해결 방법**:
1. 다른 포트로 실행:
   ```bash
   PORT=3001 npm run dev
   ```

2. 또는 기존 프로세스 종료:
   ```bash
   # 포트 3000을 사용하는 프로세스 찾기
   lsof -ti:3000
   # 프로세스 종료
   kill -9 $(lsof -ti:3000)
   ```

#### API 연결 오류

**해결 방법**:
1. 백엔드 서버가 실행 중인지 확인
2. `.env.local` 파일의 `NEXT_PUBLIC_API_URL`이 올바른지 확인
3. 브라우저 개발자 도구의 Network 탭에서 오류 확인

#### 패키지 설치 오류

**해결 방법**:
1. 캐시 삭제 후 재설치:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Node.js 버전 확인 (18 이상 필요)

### 일반적인 문제

#### CORS 오류

백엔드의 `main.py`에서 CORS 설정이 개발 모드에서는 모든 origin을 허용하도록 설정되어 있습니다. 프로덕션 환경에서는 특정 origin만 허용하도록 수정해야 합니다.

#### 환경 변수가 적용되지 않음

1. 서버를 재시작하세요
2. `.env` 파일이 올바른 위치에 있는지 확인하세요
3. 환경 변수 이름이 대소문자를 구분하는지 확인하세요

---

## 개발 워크플로우

### 🎯 처음 시작하는 경우 (초기 설정)

프로젝트를 처음 시작하거나 새로 클론받은 경우:

#### 백엔드 초기 설정

```bash
cd backend
python3 -m venv venv              # 가상 환경 생성 (처음 한 번만)
source venv/bin/activate          # 가상 환경 활성화
pip install -r requirements.txt   # 의존성 설치 (처음 한 번만)
alembic upgrade head              # 데이터베이스 마이그레이션 (처음 한 번만)
```

#### 프론트엔드 초기 설정

```bash
cd frontend
npm install                       # 의존성 설치 (처음 한 번만)
```

---

### 🚀 일상적인 개발 시작 (매일)

매일 개발을 시작할 때:

#### 1. 백엔드 서버 시작

터미널 1번을 열고:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

#### 2. 프론트엔드 서버 시작

터미널 2번을 열고:

```bash
cd frontend
npm run dev
```

#### 3. 브라우저에서 접속

- **프론트엔드 (메인)**: http://localhost:3000
- **백엔드 API 문서**: http://localhost:8000/docs

---

### 💡 코드 변경 시

- **백엔드**: `--reload` 옵션으로 자동 재시작됩니다 (수동 재시작 불필요)
- **프론트엔드**: Next.js가 자동으로 핫 리로드됩니다 (브라우저 자동 새로고침)

### 🛑 서버 종료

각 터미널에서 `Ctrl + C`를 눌러 서버를 종료합니다.

---

### 📋 체크리스트

#### 처음 시작할 때
- [ ] PostgreSQL 데이터베이스 생성
- [ ] 백엔드 `.env` 파일 생성 및 설정
- [ ] 백엔드 가상 환경 생성
- [ ] 백엔드 의존성 설치
- [ ] 백엔드 데이터베이스 마이그레이션
- [ ] 프론트엔드 의존성 설치

#### 매일 개발 시작할 때
- [ ] 백엔드: 가상 환경 활성화 → 서버 실행
- [ ] 프론트엔드: 서버 실행
- [ ] 브라우저에서 http://localhost:3000 접속 확인

---

## 추가 정보

- 백엔드 API 문서는 Swagger UI (http://localhost:8000/docs)에서 확인할 수 있습니다
- 데이터베이스 스키마 변경 시 Alembic 마이그레이션을 사용하세요
- 테스트 실행 방법은 각 디렉토리의 README를 참고하세요

---

## 지원

문제가 발생하면 다음을 확인하세요:

1. 모든 사전 요구사항이 설치되어 있는지
2. 데이터베이스가 실행 중인지
3. 환경 변수가 올바르게 설정되어 있는지
4. 포트가 충돌하지 않는지

추가 도움이 필요하면 프로젝트 저장소의 이슈를 확인하거나 문의하세요.

