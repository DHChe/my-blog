# TIL AI 초안 생성 테스트 입력 텍스트

## 1. 짧은 텍스트 (간단한 개념)

### React useEffect 클린업
```
React의 useEffect 훅에서 클린업 함수가 필요한 이유와 사용법에 대해 배웠다. 구독(subscription)이나 타이머를 설정한 경우 컴포넌트가 언마운트될 때 정리해야 메모리 누수를 방지할 수 있다.
```

### Python 리스트 컴프리헨션
```
Python에서 리스트 컴프리헨션을 사용하면 기존 리스트를 기반으로 새로운 리스트를 간결하게 생성할 수 있다. 예를 들어 [x*2 for x in range(10)] 같은 형태로 작성할 수 있다.
```

---

## 2. 중간 길이 텍스트 (실용적인 예제 포함)

### JavaScript async/await
```
JavaScript의 async/await 문법에 대해 배웠다. Promise를 더 읽기 쉽게 작성할 수 있는 방법이다. async 함수는 항상 Promise를 반환하고, await는 Promise가 resolve될 때까지 기다린다. 에러 처리는 try-catch 블록으로 할 수 있다.

예제:
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}
```

### CSS Grid 레이아웃
```
CSS Grid를 사용하여 반응형 레이아웃을 만드는 방법을 배웠다. grid-template-columns와 grid-template-rows로 그리드 구조를 정의하고, grid-area로 아이템을 배치할 수 있다. fr 단위를 사용하면 유연한 비율 기반 레이아웃을 만들 수 있다.

예제:
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

### Python 가상환경
```
Python 가상환경(virtual environment)의 중요성을 배웠다. 각 프로젝트마다 독립적인 패키지 환경을 만들어서 의존성 충돌을 방지할 수 있다. venv 모듈을 사용하여 가상환경을 생성하고 활성화하는 방법을 익혔다.

명령어:
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 3. 긴 텍스트 (복잡한 개념)

### RESTful API 설계 원칙
```
RESTful API 설계 원칙에 대해 깊이 있게 학습했다. REST는 Representational State Transfer의 약자로, 웹의 아키텍처 스타일이다.

주요 원칙:
1. 리소스 기반: URL은 리소스를 나타내고, 동사가 아닌 명사로 표현
2. HTTP 메서드 사용: GET(조회), POST(생성), PUT(전체 수정), PATCH(부분 수정), DELETE(삭제)
3. 상태 코드 활용: 200(성공), 201(생성), 400(잘못된 요청), 404(없음), 500(서버 오류)
4. 무상태성: 각 요청은 독립적이며 서버는 클라이언트 상태를 저장하지 않음
5. 계층화된 시스템: 프록시, 게이트웨이 등을 통한 중간 계층 허용

예제:
GET /api/users/123          # 사용자 조회
POST /api/users              # 사용자 생성
PUT /api/users/123           # 사용자 전체 수정
PATCH /api/users/123         # 사용자 부분 수정
DELETE /api/users/123       # 사용자 삭제

응답 형식은 JSON을 사용하고, 에러 응답도 일관된 형식으로 제공해야 한다.
```

### Docker 컨테이너와 이미지
```
Docker의 기본 개념인 컨테이너와 이미지의 차이를 이해했다. 이미지는 읽기 전용 템플릿이고, 컨테이너는 이미지를 실행한 인스턴스다. Dockerfile을 작성하여 이미지를 빌드하고, docker-compose로 여러 컨테이너를 관리할 수 있다.

Dockerfile 예제:
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

주요 명령어:
- docker build -t myapp .          # 이미지 빌드
- docker run -p 3000:3000 myapp    # 컨테이너 실행
- docker ps                         # 실행 중인 컨테이너 목록
- docker images                     # 이미지 목록
- docker-compose up                 # docker-compose 실행
```

### SQL JOIN 종류
```
SQL의 다양한 JOIN 종류와 사용 시나리오를 배웠다. INNER JOIN은 양쪽 테이블에 모두 존재하는 데이터만, LEFT JOIN은 왼쪽 테이블의 모든 데이터와 오른쪽 테이블의 매칭되는 데이터를 반환한다. RIGHT JOIN과 FULL OUTER JOIN도 각각의 용도가 있다.

예제:
-- INNER JOIN: 두 테이블 모두에 있는 데이터만
SELECT u.name, o.order_id
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN: 모든 사용자와 주문 정보 (주문 없는 사용자도 포함)
SELECT u.name, o.order_id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- RIGHT JOIN: 모든 주문과 사용자 정보 (사용자 없는 주문도 포함)
SELECT u.name, o.order_id
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
```

---

## 4. URL 테스트용 (실제 기술 블로그/문서)

### 기술 문서 URL 예시
```
https://react.dev/reference/react/useEffect
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
https://docs.python.org/3/tutorial/venv.html
https://docs.docker.com/get-started/
https://www.postgresql.org/docs/current/tutorial-join.html
```

---

## 5. 실전 예제 (실제 학습 내용 시뮬레이션)

### Next.js App Router의 서버 컴포넌트
```
Next.js 13+의 App Router에서 서버 컴포넌트와 클라이언트 컴포넌트의 차이를 배웠다. 서버 컴포넌트는 기본적으로 서버에서 렌더링되어 번들 크기를 줄이고 성능을 향상시킨다. 'use client' 지시어를 사용하면 클라이언트 컴포넌트로 만들 수 있다.

서버 컴포넌트는:
- 데이터베이스 쿼리 직접 실행 가능
- API 키 같은 민감한 정보 접근 가능
- 번들 크기에 포함되지 않음
- 브라우저 API 사용 불가

클라이언트 컴포넌트는:
- useState, useEffect 같은 훅 사용 가능
- 브라우저 이벤트 처리 가능
- 번들 크기에 포함됨

예제:
// app/page.tsx (서버 컴포넌트)
import { db } from '@/lib/db'
import ClientButton from './ClientButton'

export default async function Page() {
  const data = await db.query('SELECT * FROM posts')
  return (
    <div>
      <h1>Posts</h1>
      <ClientButton />
    </div>
  )
}

// ClientButton.tsx (클라이언트 컴포넌트)
'use client'
import { useState } from 'react'

export default function ClientButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

### TypeScript 제네릭 활용
```
TypeScript의 제네릭(Generics)을 사용하여 재사용 가능한 타입 안전한 함수와 클래스를 만드는 방법을 배웠다. 제네릭은 타입을 파라미터처럼 사용할 수 있게 해준다.

기본 예제:
function identity<T>(arg: T): T {
  return arg
}

const num = identity<number>(42)
const str = identity<string>('hello')

인터페이스와 함께 사용:
interface Container<T> {
  value: T
  getValue(): T
}

class Box<T> implements Container<T> {
  constructor(public value: T) {}
  getValue(): T {
    return this.value
  }
}

const numberBox = new Box<number>(42)
const stringBox = new Box<string>('hello')

제약 조건 사용:
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}
```

---

## 사용 방법

1. **텍스트 입력 모드**: 위의 텍스트 예시 중 하나를 복사하여 입력 필드에 붙여넣기
2. **URL 입력 모드**: URL 예시 중 하나를 입력 필드에 붙여넣기

각 예시는 다른 복잡도와 길이를 가지고 있어 다양한 시나리오를 테스트할 수 있습니다.

