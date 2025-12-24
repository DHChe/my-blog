# FastAPI + AWS EC2 배포 가이드

## 개요

FastAPI 백엔드 API를 AWS EC2 Free Tier에 배포하는 방법을 설명합니다.

## 기술 스택

- **프레임워크**: FastAPI
- **언어**: Python 3.11+
- **데이터베이스**: PostgreSQL
- **웹 서버**: Nginx (리버스 프록시)
- **ASGI 서버**: Gunicorn + Uvicorn Workers
- **배포**: AWS EC2 (Ubuntu 22.04)
- **CI/CD**: GitHub Actions

## 프로젝트 구조

```
portfolio-api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 앱 진입점
│   ├── config.py               # 설정 관리
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # 의존성 (DB 세션 등)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py       # API 라우터 통합
│   │       └── endpoints/
│   │           ├── projects.py
│   │           ├── skills.py
│   │           └── contact.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Pydantic Settings
│   │   └── security.py         # JWT, 인증
│   ├── models/
│   │   ├── __init__.py
│   │   └── project.py          # SQLAlchemy 모델
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── project.py          # Pydantic 스키마
│   ├── crud/
│   │   ├── __init__.py
│   │   └── project.py          # CRUD 로직
│   └── db/
│       ├── __init__.py
│       ├── base.py             # SQLAlchemy Base
│       └── session.py          # DB 세션
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_api/
├── alembic/
│   ├── versions/
│   └── env.py
├── scripts/
│   ├── init_db.py
│   └── seed_data.py
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── requirements-dev.txt
├── alembic.ini
├── .env.example
└── README.md
```

## Part 1: 로컬 개발 환경 설정

### Step 1: 프로젝트 초기화

```bash
# 프로젝트 디렉토리 생성
mkdir -p /home/midiummin/projects/portfolio-api
cd /home/midiummin/projects/portfolio-api

# 가상환경 생성
python3.11 -m venv venv
source venv/bin/activate

# Git 초기화
git init
```

### Step 2: 의존성 설치

#### requirements.txt

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
gunicorn>=21.2.0
sqlalchemy>=2.0.25
psycopg2-binary>=2.9.9
alembic>=1.13.1
pydantic>=2.5.3
pydantic-settings>=2.1.0
python-multipart>=0.0.6
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
httpx>=0.26.0
```

#### requirements-dev.txt

```
-r requirements.txt
pytest>=7.4.4
pytest-asyncio>=0.23.3
pytest-cov>=4.1.0
black>=24.1.0
isort>=5.13.2
mypy>=1.8.0
```

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Step 3: 기본 앱 구조 생성

#### app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

#### app/core/config.py

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Portfolio API"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## Part 2: AWS EC2 인스턴스 생성

### Step 1: AWS 콘솔에서 EC2 생성

1. AWS 콘솔 → EC2 → "Launch Instance"
2. 설정:

| 항목 | 값 |
|------|-----|
| Name | portfolio-api |
| AMI | Ubuntu 22.04 LTS |
| Instance Type | t2.micro (Free Tier) |
| Key Pair | 새로 생성 또는 기존 사용 |
| Storage | 30 GB gp3 |

### Step 2: Security Group 설정

| Type | Port | Source | 설명 |
|------|------|--------|------|
| SSH | 22 | My IP | SSH 접속 |
| HTTP | 80 | 0.0.0.0/0 | 웹 트래픽 |
| HTTPS | 443 | 0.0.0.0/0 | SSL 트래픽 |

### Step 3: 탄력적 IP 할당 (선택)

1. EC2 → Elastic IPs → "Allocate Elastic IP address"
2. 생성된 IP → "Associate Elastic IP address" → 인스턴스 선택

## Part 3: 서버 환경 구성

### Step 1: SSH 접속

```bash
# 키 파일 권한 설정
chmod 400 your-key.pem

# SSH 접속
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 2: 시스템 업데이트 및 필수 패키지 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Python 3.11 설치
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# 기타 필수 패키지
sudo apt install -y git nginx certbot python3-certbot-nginx
```

### Step 3: PostgreSQL 설치 및 설정

```bash
# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL 시작 및 자동 시작 설정
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 및 사용자 생성
sudo -u postgres psql
```

```sql
-- PostgreSQL 프롬프트에서
CREATE USER portfolio_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE portfolio_db OWNER portfolio_user;
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO portfolio_user;
\q
```

### Step 4: 프로젝트 배포

```bash
# 프로젝트 클론
cd /home/ubuntu
git clone https://github.com/[username]/portfolio-api.git
cd portfolio-api

# 가상환경 생성 및 활성화
python3.11 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
nano .env
```

#### .env 파일 내용

```bash
DATABASE_URL=postgresql://portfolio_user:your_secure_password@localhost:5432/portfolio_db
ALLOWED_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
```

### Step 5: 데이터베이스 마이그레이션

```bash
# Alembic 마이그레이션 실행
alembic upgrade head
```

## Part 4: Gunicorn 서비스 설정

### Step 1: 로그 디렉토리 생성

```bash
sudo mkdir -p /var/log/portfolio-api
sudo chown ubuntu:www-data /var/log/portfolio-api
```

### Step 2: Systemd 서비스 파일 생성

```bash
sudo nano /etc/systemd/system/portfolio-api.service
```

```ini
[Unit]
Description=Portfolio API Service
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/portfolio-api
Environment="PATH=/home/ubuntu/portfolio-api/venv/bin"
EnvironmentFile=/home/ubuntu/portfolio-api/.env
ExecStart=/home/ubuntu/portfolio-api/venv/bin/gunicorn app.main:app \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind unix:/run/portfolio-api.sock \
    --access-logfile /var/log/portfolio-api/access.log \
    --error-logfile /var/log/portfolio-api/error.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Step 3: 서비스 시작

```bash
# 서비스 시작 및 자동 시작 설정
sudo systemctl daemon-reload
sudo systemctl start portfolio-api
sudo systemctl enable portfolio-api

# 상태 확인
sudo systemctl status portfolio-api
```

## Part 5: Nginx 리버스 프록시 설정

### Step 1: Nginx 설정 파일 생성

```bash
sudo nano /etc/nginx/sites-available/portfolio-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://unix:/run/portfolio-api.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 지원 (필요시)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 정적 파일 캐싱
    location /static/ {
        alias /home/ubuntu/portfolio-api/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 2: 설정 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/portfolio-api /etc/nginx/sites-enabled/

# 기본 설정 제거
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## Part 6: SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot으로 SSL 인증서 발급
sudo certbot --nginx -d api.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

## Part 7: CI/CD 파이프라인 (GitHub Actions)

### .github/workflows/deploy.yml

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        run: pytest tests/ -v --cov=app

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/portfolio-api
            git pull origin main
            source venv/bin/activate
            pip install -r requirements.txt
            alembic upgrade head
            sudo systemctl restart portfolio-api
            echo "Deployment completed at $(date)"
```

### GitHub Secrets 설정

1. GitHub 리포지토리 → Settings → Secrets and variables → Actions
2. 다음 시크릿 추가:

| Name | Value |
|------|-------|
| `EC2_HOST` | EC2 퍼블릭 IP 또는 도메인 |
| `EC2_SSH_KEY` | EC2 프라이빗 키 (PEM 파일 전체 내용) |

## Part 8: 보안 강화

### UFW 방화벽 설정

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Fail2ban 설치 (브루트포스 방지)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 트러블슈팅

### 서비스 로그 확인

```bash
# Gunicorn 로그
sudo tail -f /var/log/portfolio-api/error.log

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# Systemd 로그
sudo journalctl -u portfolio-api -f
```

### 서비스 재시작

```bash
sudo systemctl restart portfolio-api
sudo systemctl restart nginx
```

### 소켓 파일 권한 문제

```bash
# 소켓 파일 확인
ls -la /run/portfolio-api.sock

# 권한 수정 (필요시)
sudo chown ubuntu:www-data /run/portfolio-api.sock
```

## 관련 문서

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Uvicorn 공식 문서](https://www.uvicorn.org/)
- [배포 전략 개요](./deployment-strategy.md)
- [AWS Free Tier 가이드](./aws-free-tier-guide.md)
