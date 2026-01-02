# EC2 인스턴스 생성 - 다음 단계 가이드

> **현재 상황**: VPC와 서브넷 설정이 완료되었습니다.  
> **다음 단계**: 인스턴스 시작부터 SSH 접속까지

---

## ✅ 완료된 단계

- [x] AWS 계정 생성
- [x] 리전 선택 (ap-northeast-2)
- [x] EC2 서비스 접속
- [x] Name 설정 (`blog-api`)
- [x] AMI 선택 (Ubuntu Server 22.04 LTS)
- [x] Instance type 선택 (t2.micro)
- [x] Key pair 생성 및 다운로드
- [x] VPC 및 Subnet 설정
- [x] Auto-assign Public IP: Enable

---

## 📋 다음 단계 (순서대로 진행)

### Step 1: 보안 그룹 규칙 설정

**위치**: EC2 인스턴스 생성 페이지 → Network settings → Firewall (security groups)

1. **보안 그룹 생성**:
   - **"Create security group"** 선택 (기본 선택됨)
   - **Security group name**: `blog-api-sg` 입력
   - **Description**: `Security group for blog API server` 입력

2. **인바운드 규칙 설정**:

   **규칙 1: SSH (필수)**
   - 기본 SSH 규칙이 있으면 수정:
     - **Source type**: `My IP` 선택 (자동으로 현재 IP 입력됨)
     - **Description**: `Allow SSH from my IP` 입력
   - 없으면 추가:
     - **"Add security group rule"** 클릭
     - **Type**: `SSH` 선택
     - **Port**: `22` (자동 입력)
     - **Source type**: `My IP` 선택
     - **Description**: `Allow SSH from my IP` 입력

   **규칙 2: HTTP (필수)**
   - **"Add security group rule"** 클릭
   - **Type**: `HTTP` 선택
   - **Port**: `80` (자동 입력)
   - **Source type**: `Anywhere-IPv4` 선택
   - **Description**: `Allow HTTP traffic` 입력

   **규칙 3: HTTPS (필수)**
   - **"Add security group rule"** 다시 클릭
   - **Type**: `HTTPS` 선택
   - **Port**: `443` (자동 입력)
   - **Source type**: `Anywhere-IPv4` 선택
   - **Description**: `Allow HTTPS traffic` 입력

   > ⚠️ **보안 중요**: SSH는 반드시 "My IP"로 제한하세요. 모든 IP에 열어두면 보안 위험이 있습니다.

3. **최종 확인**:
   - 총 3개의 인바운드 규칙이 있는지 확인:
     - SSH (22) - My IP만 허용
     - HTTP (80) - 모든 IP 허용
     - HTTPS (443) - 모든 IP 허용

---

### Step 2: 스토리지 설정

**위치**: EC2 인스턴스 생성 페이지 → Configure storage

1. **스토리지 설정 확인**:
   - **Volume type**: `gp3` 선택 (기본값)
   - **Size**: `30` 입력 (GB)
   - **Free tier eligible** 표시 확인

2. **설정 확인**:
   - 30GB는 Free Tier 한도 내입니다
   - 나중에 확장 가능하지만, Free Tier 범위를 벗어나면 과금됩니다

---

### Step 3: 인스턴스 시작

**위치**: EC2 인스턴스 생성 페이지 하단

> ✅ **시작 전 최종 체크리스트**:
> - [ ] Name: `blog-api` 입력됨
> - [ ] AMI: Ubuntu Server 22.04 LTS 선택됨
> - [ ] Instance type: t2.micro 선택됨
> - [ ] Key pair: 생성 및 다운로드 완료
> - [ ] VPC: 기본 VPC 선택됨
> - [ ] Subnet: 서브넷 선택됨
> - [ ] Auto-assign Public IP: Enable 선택됨
> - [ ] Security group: `blog-api-sg` 생성됨 (SSH, HTTP, HTTPS 규칙 포함)
> - [ ] Storage: 30GB gp3 설정됨

1. **모든 설정 확인 후 오른쪽 하단의 "Launch Instance" 버튼 클릭**

2. **인스턴스 시작 확인 화면**:
   - "Your instances are now launching" 메시지 확인
   - 인스턴스 ID 표시 (예: `i-0123456789abcdef0`)
   - **이 ID를 기록해두세요!** (나중에 필요할 수 있음)

3. **"View all instances"** 버튼 클릭
   - 또는 왼쪽 메뉴에서 **"Instances"** 클릭

---

### Step 4: 인스턴스 상태 확인 및 대기

**위치**: EC2 → Instances 페이지

1. **인스턴스 목록에서 `blog-api` 찾기**

2. **Instance state 확인**:
   - `pending` → `running`으로 변경될 때까지 대기 (약 1-2분)
   - 초록색 원이 표시되면 `running` 상태

3. **Status check 확인**:
   - **Status checks** 컬럼 확인
   - `initializing` → `2/2 checks passed`로 변경될 때까지 대기 (추가 1-2분)
   - 두 개의 초록색 체크 표시가 나타나면 완료

4. **인스턴스 정보 확인**:
   - 인스턴스 선택 후 아래 **"Details"** 탭 확인:
     - **Name**: `blog-api`
     - **Instance type**: `t2.micro`
     - **Public IPv4 address**: 예) `3.34.123.45` ← **이 IP로 접속합니다!**
     - **Public IPv4 DNS**: 예) `ec2-3-34-123-45.ap-northeast-2.compute.amazonaws.com`
     - **Security groups**: `blog-api-sg`

   > ⚠️ **중요**: 
   > - Public IPv4 address를 기록해두세요 (SSH 접속에 필요)
   > - Status check가 완료되기 전에 SSH 접속을 시도하면 실패할 수 있습니다

---

### Step 5: 보안 그룹 추가 확인 (선택사항)

인스턴스 생성 시 보안 그룹 규칙을 설정했다면 이 단계는 건너뛰어도 됩니다.

**위치**: EC2 → Security Groups

1. **보안 그룹 편집**:
   - 왼쪽 메뉴에서 **"Security Groups"** 클릭
   - `blog-api-sg` 선택
   - **"Edit inbound rules"** 클릭

2. **규칙 확인 및 수정**:
   - SSH (22) - My IP만 허용 ✅
   - HTTP (80) - 모든 IP 허용 ✅
   - HTTPS (443) - 모든 IP 허용 ✅

3. **"Save rules"** 클릭

---

### Step 6: 탄력적 IP 할당 (권장)

> 💡 **탄력적 IP란?**: 인스턴스를 중지하고 다시 시작해도 IP 주소가 변경되지 않도록 고정 IP를 할당하는 기능

**위치**: EC2 → Elastic IPs

1. **탄력적 IP 할당**:
   - 왼쪽 메뉴에서 **"Elastic IPs"** 클릭
   - **"Allocate Elastic IP address"** 버튼 클릭
   - **Network border group**: 기본값 유지
   - **Public IPv4 address pool**: `Amazon's IPv4 address pool` 선택
   - **"Allocate"** 버튼 클릭

2. **탄력적 IP 연결**:
   - 할당된 탄력적 IP 선택 (체크박스 클릭)
   - **"Actions"** 드롭다운 → **"Associate Elastic IP address"** 선택
   - **Resource type**: `Instance` 선택
   - **Instance**: `blog-api` 선택
   - **Private IP address**: 자동 선택됨
   - **"Associate"** 버튼 클릭

3. **연결 확인**:
   - EC2 Instances 페이지로 돌아가기
   - `blog-api` 인스턴스의 Public IPv4 address가 탄력적 IP와 일치하는지 확인

   > ⚠️ **중요**: 
   > - 탄력적 IP를 생성했지만 인스턴스에 연결하지 않으면 시간당 약 $0.005 과금됩니다
   > - 인스턴스를 종료하면 탄력적 IP를 해제하거나 다른 인스턴스에 연결해야 합니다

---

### Step 7: SSH 접속 테스트

**위치**: 로컬 터미널

1. **키 파일 권한 설정** (Mac/Linux):
   ```bash
   # 키 파일이 다운로드 폴더에 있다고 가정
   chmod 400 ~/Downloads/blog-api-key.pem
   
   # 권한 확인
   ls -l ~/Downloads/blog-api-key.pem
   # 출력 예시: -r--------  1 user  staff  1692 Jan  1 12:00 blog-api-key.pem
   ```

2. **SSH 접속**:
   ```bash
   # Public IPv4 address 사용 (탄력적 IP를 사용한 경우 그것 사용)
   ssh -i ~/Downloads/blog-api-key.pem ubuntu@YOUR_PUBLIC_IP
   
   # 예시:
   # ssh -i ~/Downloads/blog-api-key.pem ubuntu@3.34.123.45
   ```

3. **첫 접속 시 확인 메시지**:
   ```
   The authenticity of host '3.34.123.45 (3.34.123.45)' can't be established.
   ECDSA key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
   Are you sure you want to continue connecting (yes/no/[fingerprint])? 
   ```
   **`yes`** 입력 후 Enter

4. **접속 성공 확인**:
   ```
   Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-...)
   
   ...
   
   ubuntu@ip-172-31-xx-xx:~$
   ```

5. **접속 테스트 명령**:
   ```bash
   # 현재 사용자 확인
   whoami
   # 출력: ubuntu
   
   # 시스템 정보 확인
   uname -a
   
   # 디스크 사용량 확인
   df -h
   
   # 메모리 확인
   free -h
   ```

6. **접속 종료**:
   ```bash
   exit
   ```

---

### Step 8: 예산 알림 설정 (중요!)

> ⚠️ **매우 중요**: 예상치 못한 과금을 방지하기 위해 반드시 설정하세요.

**위치**: AWS Billing → Budgets

1. **Billing 대시보드 접속**:
   - AWS 콘솔 상단 검색창에 `Billing` 입력
   - **"Billing"** 클릭
   - 또는 직접 링크: https://console.aws.amazon.com/billing/

2. **Budgets 메뉴 접속**:
   - 왼쪽 메뉴에서 **"Budgets"** 클릭
   - **"Create budget"** 버튼 클릭

3. **Budget 설정**:
   - **Budget type**: `Cost budget` 선택
   - **"Next"** 클릭
   - **Budget name**: `Blog API Monthly Budget` 입력
   - **Period**: `Monthly` 선택
   - **Budget effective period**: `Recurring budget` 선택
   - **Budget amount**: `Fixed` 선택
   - **Budgeted amount**: `1.00` 입력 (USD)
   - **"Next"** 클릭

4. **알림 설정**:
   - **Alert 1**:
     - **Alert threshold**: `50` (50% 도달 시)
     - **Email recipients**: 본인 이메일 주소 입력
   - **"Add another alert"** 클릭
   - **Alert 2**:
     - **Alert threshold**: `80` (80% 도달 시)
     - **Email recipients**: 동일한 이메일 주소 입력
   - **"Add another alert"** 클릭
   - **Alert 3**:
     - **Alert threshold**: `100` (100% 도달 시)
     - **Email recipients**: 동일한 이메일 주소 입력
   - **"Next"** 클릭

5. **예산 생성 완료**:
   - 설정 요약 확인
   - **"Create budget"** 버튼 클릭
   - "Successfully created budget" 메시지 확인

---

## ✅ 완료 체크리스트

### 인스턴스 생성
- [ ] 인스턴스 상태가 `running`
- [ ] Status check가 `2/2 checks passed`
- [ ] Public IPv4 address 확인 및 기록

### 보안 그룹
- [ ] SSH (22번 포트) - My IP만 허용
- [ ] HTTP (80번 포트) - 모든 IP 허용
- [ ] HTTPS (443번 포트) - 모든 IP 허용

### 네트워크
- [ ] 탄력적 IP 할당 및 연결 (선택사항)
- [ ] SSH 접속 테스트 성공

### 보안
- [ ] 예산 알림 설정 완료 ($1 임계값)
- [ ] 키 파일 권한 설정 (chmod 400)

---

## 🎉 다음 단계

EC2 인스턴스 생성이 완료되었습니다! 다음 단계로 진행하세요:

1. **서버 환경 구성**: [백엔드 배포 가이드](../docs/backend-deployment.md)의 Part 3 참고
   - 시스템 업데이트 및 필수 패키지 설치
   - PostgreSQL 설치 및 데이터베이스 생성
   - 프로젝트 클론 및 환경 변수 설정

2. **서비스 설정**: [백엔드 배포 가이드](../docs/backend-deployment.md)의 Part 4-6 참고
   - Gunicorn 서비스 설정
   - Nginx 리버스 프록시 설정
   - SSL 인증서 발급

---

## ❓ 문제 발생 시

자주 발생하는 문제와 해결 방법은 [aws-ec2-setup-guide.md](./aws-ec2-setup-guide.md)의 "8-2. 자주 발생하는 문제 해결" 섹션을 참고하세요.

---

**작성일**: 2024년  
**문서 버전**: 1.0





