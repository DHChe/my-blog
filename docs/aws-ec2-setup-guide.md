# AWS EC2 인스턴스 생성 및 보안 그룹 설정 상세 가이드

> **대상**: 배포를 처음 경험하는 사용자  
> **예상 소요 시간**: 30-40분  
> **사전 준비**: 신용카드 또는 체크카드 (Free Tier 사용 시에도 필요)

---

## 목차

1. [AWS 계정 생성](#1-aws-계정-생성)
2. [AWS 콘솔 접속 및 리전 선택](#2-aws-콘솔-접속-및-리전-선택)
3. [EC2 인스턴스 생성](#3-ec2-인스턴스-생성)
4. [보안 그룹 설정](#4-보안-그룹-설정)
5. [탄력적 IP 할당](#5-탄력적-ip-할당-권장)
6. [SSH 접속 테스트](#6-ssh-접속-테스트)
7. [예산 알림 설정](#7-예산-알림-설정-중요)
8. [체크리스트 및 문제 해결](#8-체크리스트-및-문제-해결)

---

## 1. AWS 계정 생성

### 1-1. AWS 홈페이지 접속

1. 브라우저에서 다음 주소로 이동:
   **https://aws.amazon.com**

2. 오른쪽 상단의 **"Create an AWS Account"** 또는 **"Sign In to the Console"** 버튼 클릭

   > 💡 **참고**: 이미 계정이 있다면 "Sign In to the Console"을 클릭하고 2단계로 넘어가세요.

### 1-2. 계정 생성 프로세스

#### Step 1: 이메일 주소 입력

1. **"Create a new AWS account"** 클릭
2. 이메일 주소 입력 (예: `yourname@example.com`)
3. AWS 계정 이름 입력 (예: `My Blog API`)
4. **"Verify email address"** 클릭
5. 이메일로 전송된 인증 코드 입력
6. **"Verify"** 클릭

#### Step 2: 비밀번호 설정

1. 비밀번호 입력 (최소 8자, 대소문자, 숫자, 특수문자 포함 권장)
2. 비밀번호 확인 입력
3. **"Continue"** 클릭

#### Step 3: 연락처 정보 입력

1. **Full name**: 이름 입력
2. **Phone number**: 전화번호 입력 (국제 형식: +82 10-1234-5678)
3. **Country/Region**: `South Korea` 선택
4. **Address**: 주소 입력
5. **City**: 도시 입력
6. **State/Province**: 시/도 선택
7. **Postal code**: 우편번호 입력
8. **"Create account and continue"** 클릭

#### Step 4: 결제 정보 입력

> ⚠️ **중요**: Free Tier를 사용하더라도 결제 정보 입력이 필요합니다.  
> 하지만 Free Tier 범위 내에서는 실제로 과금되지 않습니다.

1. **Credit or debit card number**: 카드 번호 입력
2. **Expiration date**: 만료일 입력
3. **Cardholder name**: 카드 소유자 이름 입력
4. **Billing address**: 청구지 주소 (위치 정보와 동일하게 자동 입력됨)
5. **"Secure Submit"** 클릭

#### Step 5: 전화번호 인증

1. **Phone number**: 전화번호 확인 (이미 입력한 번호가 표시됨)
2. **"Send SMS"** 또는 **"Call me now"** 선택
3. 인증 코드 입력
4. **"Continue"** 클릭

#### Step 6: 지원 플랜 선택

1. **"Basic Plan - Free"** 선택 (기본 선택됨)
2. **"Complete sign up"** 클릭

### 1-3. 계정 활성화 대기

- 계정 생성 완료 메시지 확인
- 이메일로 확인 이메일 수신 (몇 분 소요)
- 계정이 활성화될 때까지 대기 (보통 즉시, 최대 24시간)

### 1-4. AWS 콘솔 로그인

1. **https://console.aws.amazon.com** 접속
2. 이메일 주소와 비밀번호로 로그인
3. 처음 로그인 시 약관 동의 화면이 나타날 수 있음

---

## 2. AWS 콘솔 접속 및 리전 선택

### 2-1. AWS 콘솔 접속

1. 브라우저에서 **https://console.aws.amazon.com** 접속
2. 이메일 주소와 비밀번호 입력
3. **"Sign in"** 클릭

### 2-2. 리전 선택 (매우 중요!)

> ⚠️ **중요**: 리전을 잘못 선택하면 지연 시간이 증가하고, Free Tier가 적용되지 않을 수 있습니다.

1. AWS 콘솔 오른쪽 상단의 **리전 선택 드롭다운** 클릭
   - 기본값은 `US East (N. Virginia)` 일 수 있음

2. **"Asia Pacific (Seoul) ap-northeast-2"** 선택
   - 한국에서 가장 가까운 리전
   - Free Tier 사용 가능
   - 지연 시간 최소화

3. 리전이 변경되었는지 확인
   - 오른쪽 상단에 `ap-northeast-2` 표시 확인

> 💡 **참고**: 리전은 언제든지 변경할 수 있지만, 리소스는 리전별로 독립적입니다.

---

## 3. EC2 인스턴스 생성

### 3-1. EC2 서비스 접속

1. AWS 콘솔 상단의 **검색창**에 `EC2` 입력
2. 검색 결과에서 **"EC2"** 클릭
   - 또는 직접 링크: https://console.aws.amazon.com/ec2/

3. EC2 대시보드 화면 확인
   - 왼쪽에 메뉴, 중앙에 리소스 요약 표시

### 3-2. 인스턴스 시작

1. EC2 대시보드 오른쪽 상단의 **"Launch Instance"** 버튼 클릭
   - 또는 왼쪽 메뉴에서 **"Instances"** → **"Launch Instance"** 클릭

### 3-3. Name and tags 설정

1. **"Name"** 필드에 `blog-api` 입력
   - 이 이름은 인스턴스 목록에서 표시됩니다
   - 나중에 변경 가능

2. **"Add additional tags"**는 선택사항 (나중에 추가 가능)

### 3-4. Application and OS Images (AMI) 선택

> 💡 **AMI (Amazon Machine Image)**: 운영체제와 기본 소프트웨어가 포함된 템플릿

1. **"Quick Start"** 탭 확인 (기본 선택됨)
2. **"Ubuntu"** 선택
   - 여러 버전이 표시됨
3. **"Ubuntu Server 22.04 LTS"** 선택
   - LTS = Long Term Support (장기 지원 버전)
   - Free tier eligible 표시 확인
   - 64-bit (x86) 선택

> ⚠️ **주의**: 
> - `Ubuntu Pro`는 유료이므로 선택하지 마세요
> - `Ubuntu Server 20.04 LTS`도 가능하지만, 22.04 권장

### 3-5. Instance type 선택

1. **"Instance type"** 섹션 확인
2. **"t2.micro"** 선택
   - Free tier eligible 표시 확인
   - vCPU: 1, Memory: 1 GiB
   - Network performance: Low to Moderate

> ⚠️ **주의**: 
> - `t3.micro`도 Free Tier에 포함되지만, 일부 리전에서는 t2.micro만 무료
> - `t2.small`, `t3.small` 등은 즉시 과금되므로 선택하지 마세요

### 3-6. Key pair 생성 (매우 중요!)

> ⚠️ **중요**: 키 페어는 SSH 접속에 필수이며, 한 번만 다운로드 가능합니다.

1. **"Key pair (login)"** 섹션에서 **"Create new key pair"** 클릭

2. 키 페어 생성 창에서:
   - **Name**: `blog-api-key` 입력
   - **Key pair type**: `RSA` 선택
   - **Private key file format**: `.pem` 선택 (Windows 사용자는 `.ppk`도 가능)
   - **"Create key pair"** 클릭

3. 키 파일 자동 다운로드 확인
   - 브라우저 다운로드 폴더에 `blog-api-key.pem` 파일이 다운로드됨
   - 이 파일을 안전한 곳에 보관하세요 (재다운로드 불가능!)

> 💡 **보안 팁**:
> - 키 파일을 공유하거나 GitHub에 업로드하지 마세요
> - 키 파일을 잃어버리면 인스턴스에 접속할 수 없습니다
> - 키 파일은 백업해두세요

### 3-7. Network settings 설정

1. **"Network settings"** 섹션에서 **"Edit"** 클릭

2. VPC 및 Subnet 설정:

   #### 경우 1: 기본 VPC와 서브넷이 모두 있는 경우 (가장 일반적)
   
   - **VPC**: `vpc-xxxxx (default)` 선택 (기본 VPC 사용)
   - **Subnet**: `subnet-xxxxx (default)` 선택
   - **Auto-assign Public IP**: `Enable` 선택 (중요!)

   #### 경우 2: 기본 VPC는 있지만 서브넷이 없는 경우 ⚠️
   
   > 💡 **현재 상황**: VPC 드롭다운에는 기본 VPC가 보이지만, Subnet 드롭다운이 "기본설정없음"으로 표시되는 경우
   
   **먼저 확인: 실제로 서브넷이 없는지 확인**
   
   1. **VPC 대시보드에서 서브넷 확인**:
      - 새 탭에서 VPC 대시보드로 이동: https://console.aws.amazon.com/vpc/
      - 왼쪽 메뉴에서 **"Subnets"** 클릭
      - 기본 VPC의 서브넷이 있는지 확인
   
   2. **서브넷이 이미 있는 경우**:
      - EC2 인스턴스 생성 페이지로 돌아가기
      - 브라우저를 새로고침하거나 페이지를 다시 로드
      - **"Network settings"** → **"Edit"** 클릭
      - **Subnet** 드롭다운에서 기존 서브넷 선택
      - 이 경우 서브넷을 새로 생성할 필요가 없습니다! ✅
   
   3. **서브넷이 정말 없는 경우에만 아래 방법 진행**:
   
   **해결 방법: 기본 VPC에 서브넷 생성**
   
   1. **새 탭에서 VPC 대시보드로 이동**:
      - AWS 콘솔 검색창에 `VPC` 입력
      - **"VPC"** 클릭
      - 또는 직접 링크: https://console.aws.amazon.com/vpc/
   
   2. **기본 VPC의 CIDR 블록 확인**:
      - 왼쪽 메뉴에서 **"Your VPCs"** 클릭
      - 기본 VPC 선택 (예: `vpc-0123456789abcdef0`)
      - **IPv4 CIDR** 확인 (예: `172.31.0.0/16` 또는 `10.0.0.0/16`)
      - 이 CIDR 블록을 기억해두세요!
   
   3. **왼쪽 메뉴에서 "Subnets"** 클릭
   
   4. **"Create subnet"** 버튼 클릭
   
   5. **서브넷 설정**:
      - **VPC ID**: 기본 VPC 선택 (위에서 확인한 VPC)
      - **Subnet name**: `default-subnet-1a` 입력
      - **Availability Zone**: `ap-northeast-2a` 선택 (첫 번째 가용영역)
      - **IPv4 CIDR block**: VPC의 CIDR 범위 내에서 설정
        > ⚠️ **중요**: 서브넷 CIDR은 반드시 VPC CIDR 범위 내에 있어야 합니다!
        > 
        > **VPC CIDR이 `172.31.0.0/16`인 경우 (가장 일반적)**:
        > 
        > **⚠️ 먼저 확인**: VPC 대시보드 → Subnets 메뉴에서 기존 서브넷이 있는지 확인하세요!
        > 
        > - **기존 서브넷이 없는 경우**:
        >   - 플레이스홀더로 `172.31.0.0/20`이 표시되면 **그대로 사용** ✅ (권장)
        >   - 또는 `172.31.16.0/20`, `172.31.32.0/20` 등 사용 가능
        > 
        > - **기존 서브넷이 `172.31.0.0/20`으로 이미 있는 경우**:
        >   - ⚠️ **`172.31.1.0/24`는 사용할 수 없습니다!** (172.31.1.0 ~ 172.31.1.255는 172.31.0.0/20 범위에 포함되어 중첩됨)
        >   - ✅ **해결책 1 (권장)**: 서브넷을 새로 생성하지 말고, EC2 인스턴스 생성 페이지로 돌아가서 기존 서브넷을 선택하세요!
        >   - ✅ **해결책 2**: 다른 CIDR 사용 - `172.31.16.0/20` (172.31.16.0 ~ 172.31.31.255) 또는 `172.31.32.0/20` 등
        
        > 
        > **VPC CIDR이 `10.0.0.0/16`인 경우**:
        > - 서브넷 CIDR: `10.0.1.0/24` 또는 `10.0.0.0/20` 등
        > 
        > 💡 **CIDR 표기법 설명**:
        > - `/16` = 65,536개의 IP 주소 (172.31.0.0 ~ 172.31.255.255)
        > - `/20` = 4,096개의 IP 주소 (172.31.0.0 ~ 172.31.15.255) ← 일반적으로 사용
        > - `/24` = 256개의 IP 주소 (172.31.1.0 ~ 172.31.1.255) ← 작은 서브넷
        > 
        > 💡 **팁**: 
        > - 플레이스홀더로 제안된 값(`172.31.0.0/20`)이 있다면 **그대로 사용하는 것을 권장**합니다
        > - AWS가 자동으로 제안하는 값은 일반적으로 적절한 크기입니다
        > - `/20`은 4,096개의 IP를 제공하므로 대부분의 경우 충분합니다
        > - 더 작은 서브넷이 필요하면 `/24`를 사용할 수 있습니다
   
   5. **"Create subnet"** 버튼 클릭
   
   > ⚠️ **오류 발생 시**: "CIDR 주소가 기존 서브넷 CIDR: 172.31.0.0/20과(와) 중첩됩니다" 오류가 발생하면
   > 
   > **이것은 정상적인 상황입니다!** 기존 서브넷이 이미 존재한다는 의미입니다.
   > 
   > **즉시 해결 방법**:
   > 1. ✅ **서브넷 생성 창을 닫으세요** (Cancel 또는 X 버튼)
   > 2. ✅ **EC2 인스턴스 생성 페이지로 돌아가세요**
   > 3. ✅ **Network settings → Edit** 클릭
   > 4. ✅ **Subnet 드롭다운에서 기존 서브넷(`172.31.0.0/20`)을 선택하세요**
   > 5. ✅ **Auto-assign Public IP: Enable** 선택
   > 6. ✅ **인스턴스 생성을 계속 진행하세요**
   > 
   > **또는 새로운 서브넷이 필요한 경우**:
   > - 다른 CIDR 블록 사용: `172.31.16.0/20`, `172.31.32.0/20`, `172.31.48.0/20` 등
   > - 각 `/20` 블록은 4,096개의 IP를 제공하므로 충분합니다
   
   6. **인터넷 게이트웨이 확인** (중요!):
      - 왼쪽 메뉴에서 **"Internet Gateways"** 클릭
      - 기본 VPC에 연결된 인터넷 게이트웨이가 있는지 확인
      - 없다면:
        - **"Create internet gateway"** 클릭
        - Name: `default-igw` 입력
        - **"Create internet gateway"** 클릭
        - 생성된 인터넷 게이트웨이 선택 → **"Actions"** → **"Attach to VPC"**
        - 기본 VPC 선택 → **"Attach internet gateway"** 클릭
   
   7. **라우팅 테이블 확인**:
      - 왼쪽 메뉴에서 **"Route Tables"** 클릭
      - 기본 VPC의 라우팅 테이블 선택
      - **"Routes"** 탭에서 `0.0.0.0/0` → 인터넷 게이트웨이로 가는 라우트가 있는지 확인
      - 없다면:
        - **"Edit routes"** 클릭
        - **"Add route"** 클릭
        - **Destination**: `0.0.0.0/0` 입력
        - **Target**: 인터넷 게이트웨이 선택
        - **"Save changes"** 클릭
   
   8. **EC2 인스턴스 생성 페이지로 돌아가기**:
      - 브라우저에서 EC2 인스턴스 생성 페이지로 돌아감
      - **"Network settings"** 섹션에서:
        - **VPC**: 기본 VPC 선택 (이미 선택되어 있을 수 있음)
        - **Subnet**: 방금 생성한 `default-subnet-1a` 선택
        - **Auto-assign Public IP**: `Enable` 선택 (중요!)
   
   > ⚠️ **중요**: 
   > - 서브넷을 생성한 후에도 Public IP가 자동 할당되지 않으면 인스턴스에 외부에서 접속할 수 없습니다
   > - 인터넷 게이트웨이가 연결되어 있지 않으면 외부 인터넷 접속이 불가능합니다

   #### 경우 3: 기본 VPC가 없는 경우 (VPC 드롭다운이 비어있음)
   
   > ⚠️ **주의**: 일부 AWS 계정에서는 기본 VPC가 없거나 삭제된 경우가 있습니다.
   
   **해결 방법 A: 기본 VPC 생성 (권장)**
   
   1. 새 탭에서 VPC 대시보드로 이동:
      - AWS 콘솔 검색창에 `VPC` 입력
      - **"VPC"** 클릭
      - 또는 직접 링크: https://console.aws.amazon.com/vpc/
   
   2. 왼쪽 메뉴에서 **"Your VPCs"** 클릭
   
   3. **"Create VPC"** 버튼 클릭
   
   4. VPC 설정:
      - **Name tag**: `default-vpc` 입력
      - **IPv4 CIDR block**: 
        - 드롭다운에 제안된 값이 있다면 그것을 사용 (예: `172.31.0.0/16`)
        - 없다면 `10.0.0.0/16` 입력
        - 또는 다른 프라이빗 IP 범위 사용 가능
      - **IPv6 CIDR block**: `No IPv6 CIDR block` 선택 (기본값)
      - **Tenancy**: `Default` 선택
   
   5. **"Create VPC"** 버튼 클릭
   
   6. VPC 생성 완료 후, 생성된 VPC의 **IPv4 CIDR** 확인
   
   7. **"Create subnet"** 버튼 클릭
   
   8. 서브넷 설정:
      - **VPC ID**: 방금 생성한 `default-vpc` 선택
      - **Subnet name**: `default-subnet-1a` 입력
      - **Availability Zone**: `ap-northeast-2a` 선택
      - **IPv4 CIDR block**: VPC의 CIDR 범위 내에서 설정
        > ⚠️ **중요**: 서브넷 CIDR은 반드시 VPC CIDR 범위 내에 있어야 합니다!
        > 
        > **VPC CIDR이 `172.31.0.0/16`인 경우**:
        > - 플레이스홀더로 `172.31.0.0/20`이 제안되면 **그대로 사용** ✅ (권장)
        > - 또는 `172.31.1.0/24` 입력 가능
        > 
        > **VPC CIDR이 `10.0.0.0/16`인 경우**:
        > - 서브넷: `10.0.1.0/24` 또는 `10.0.0.0/20`
   
   8. **"Create subnet"** 버튼 클릭
   
   9. EC2 인스턴스 생성 페이지로 돌아가서:
      - **VPC**: 방금 생성한 `default-vpc` 선택
      - **Subnet**: 방금 생성한 `default-subnet-1a` 선택
      - **Auto-assign Public IP**: `Enable` 선택
   
   **해결 방법 B: 기존 VPC 사용**
   
   1. VPC 드롭다운에서 사용 가능한 VPC 선택
   2. Subnet 드롭다운에서 해당 VPC의 서브넷 선택
   3. **Auto-assign Public IP**: `Enable` 선택
   
   > 💡 **팁**: 
   > - 기본 VPC를 생성하면 인터넷 게이트웨이와 라우팅 테이블이 자동으로 설정됩니다
   > - 기본 VPC를 사용하는 것이 가장 간단하고 안전합니다
   > - 기존 VPC를 사용하는 경우, 인터넷 게이트웨이와 라우팅 테이블이 올바르게 설정되어 있는지 확인하세요

3. **Firewall (security groups)** 설정:
   - **"Create security group"** 선택 (기본 선택됨)
   - **Security group name**: `blog-api-sg` 입력
   - **Description**: `Security group for blog API server` 입력

4. **Inbound security group rules** 섹션:
   - 기본적으로 SSH 규칙이 하나 있음
   - **SSH 규칙 수정**:
     - **Source type**: `My IP` 선택 (자동으로 현재 IP 입력됨)
     - **Description**: `Allow SSH from my IP` 입력
   - **HTTP 규칙 추가**:
     - **"Add security group rule"** 클릭
     - **Type**: `HTTP` 선택
     - **Source type**: `Anywhere` 선택 (모든 IPv4 주소 허용)
     - **Description**: `Allow HTTP traffic` 입력
   - **HTTPS 규칙 추가**:
     - **"Add security group rule"** 다시 클릭
     - **Type**: `HTTPS` 선택
     - **Source type**: `Anywhere` 선택 (모든 IPv4 주소 허용)
     - **Description**: `Allow HTTPS traffic` 입력

   > ⚠️ **보안 중요**: 
   > - SSH는 "My IP"로 제한하는 것이 보안상 중요합니다
   > - 나중에 보안 그룹에서도 수정 가능하지만, 여기서 설정하는 것이 편리합니다

### 3-8. Configure storage 설정

1. **"Configure storage"** 섹션 확인

2. 스토리지 설정:
   - **Volume type**: `gp3` 선택 (기본값)
   - **Size**: `30` 입력 (GB)
   - **Free tier eligible** 표시 확인

> 💡 **참고**: 
> - 30GB는 Free Tier 한도 내입니다
> - 나중에 확장 가능하지만, Free Tier 범위를 벗어나면 과금됩니다

### 3-9. Advanced details (선택사항)

1. **"Advanced details"** 섹션은 기본값 유지
   - User data는 나중에 설정 가능

### 3-10. 인스턴스 시작

1. 오른쪽 하단의 **"Launch Instance"** 버튼 클릭

2. 인스턴스 시작 확인 화면:
   - "Your instances are now launching" 메시지 확인
   - 인스턴스 ID 표시 (예: `i-0123456789abcdef0`)

3. **"View all instances"** 버튼 클릭

### 3-11. 인스턴스 상태 확인

1. EC2 Instances 페이지로 이동됨

2. 인스턴스 상태 확인:
   - **Instance state**: `pending` → `running`으로 변경될 때까지 대기 (약 1-2분)
   - **Status check**: `initializing` → `2/2 checks passed`로 변경될 때까지 대기

3. 인스턴스 정보 확인:
   - **Name**: `blog-api`
   - **Instance type**: `t2.micro`
   - **Public IPv4 address**: 예) `3.34.123.45` (이 IP로 접속)
   - **Public IPv4 DNS**: 예) `ec2-3-34-123-45.ap-northeast-2.compute.amazonaws.com`

> 💡 **팁**: 
> - 인스턴스가 `running` 상태가 되어도 Status check가 완료될 때까지 1-2분 더 기다리는 것이 좋습니다
> - Status check가 완료되면 SSH 접속이 원활합니다

---

## 4. 보안 그룹 설정

### 4-1. 보안 그룹 편집

#### 방법 1: 인스턴스에서 직접 접근

1. EC2 Instances 페이지에서 `blog-api` 인스턴스 선택
2. 아래 **"Security"** 탭 클릭
3. **"Security groups"** 섹션에서 `blog-api-sg` 링크 클릭

#### 방법 2: 보안 그룹 메뉴에서 접근

1. 왼쪽 메뉴에서 **"Security Groups"** 클릭
2. `blog-api-sg` 선택

### 4-2. 인바운드 규칙 편집

1. **"Inbound rules"** 탭 확인
2. **"Edit inbound rules"** 버튼 클릭

### 4-3. SSH 규칙 수정 (보안 강화)

1. 기존 SSH 규칙 확인:
   - Type: SSH
   - Port: 22
   - Source: `0.0.0.0/0` (모든 IP 허용) ← 보안 위험!

2. SSH 규칙 수정:
   - **Source type**: `My IP` 선택
     - 자동으로 현재 IP 주소가 입력됨 (예: `123.456.789.0/32`)
   - **Description**: `Allow SSH from my IP` 입력

> ⚠️ **보안 중요**: 
> - SSH를 모든 IP에 열어두면 해커의 공격 대상이 될 수 있습니다
> - "My IP"로 제한하면 본인의 IP에서만 접속 가능합니다
> - IP가 변경되면 보안 그룹 규칙을 다시 수정해야 합니다

### 4-4. HTTP 규칙 확인

1. HTTP 규칙이 있는지 확인:
   - Type: HTTP
   - Port: 80
   - Source: `0.0.0.0/0` (모든 IP 허용) ← 정상
   - Description: `Allow HTTP traffic`

2. 없으면 추가:
   - **"Add rule"** 클릭
   - **Type**: `HTTP` 선택
   - **Source type**: `Anywhere` 선택 (모든 IPv4 주소 허용)
   - **Description**: `Allow HTTP traffic` 입력

### 4-5. HTTPS 규칙 확인

1. HTTPS 규칙이 있는지 확인:
   - Type: HTTPS
   - Port: 443
   - Source: `0.0.0.0/0` (모든 IP 허용) ← 정상
   - Description: `Allow HTTPS traffic`

2. 없으면 추가:
   - **"Add rule"** 클릭
   - **Type**: `HTTPS` 선택
   - **Source type**: `Anywhere` 선택 (모든 IPv4 주소 허용)
   - **Description**: `Allow HTTPS traffic` 입력

### 4-6. 규칙 저장

1. 모든 규칙 확인:
   - SSH (22) - My IP만 허용
   - HTTP (80) - 모든 IP 허용
   - HTTPS (443) - 모든 IP 허용

2. **"Save rules"** 버튼 클릭

3. 저장 완료 확인:
   - "Successfully updated security group rules" 메시지 확인

---

## 5. 탄력적 IP 할당 (권장)

> 💡 **탄력적 IP란?**: 인스턴스를 중지하고 다시 시작해도 IP 주소가 변경되지 않도록 고정 IP를 할당하는 기능

### 5-1. 탄력적 IP 할당

1. 왼쪽 메뉴에서 **"Elastic IPs"** 클릭
   - 또는 검색창에 "Elastic IP" 입력

2. **"Allocate Elastic IP address"** 버튼 클릭

3. 탄력적 IP 설정:
   - **Network border group**: 기본값 유지
   - **Public IPv4 address pool**: `Amazon's IPv4 address pool` 선택 (기본값)

4. **"Allocate"** 버튼 클릭

5. 할당 완료 확인:
   - 새로운 탄력적 IP 주소 확인 (예: `3.34.123.45`)

### 5-2. 탄력적 IP 연결

1. 할당된 탄력적 IP 선택 (체크박스 클릭)

2. **"Actions"** 드롭다운 → **"Associate Elastic IP address"** 선택

3. 연결 설정:
   - **Resource type**: `Instance` 선택
   - **Instance**: `blog-api` 선택
   - **Private IP address**: 자동 선택됨

4. **"Associate"** 버튼 클릭

5. 연결 완료 확인:
   - 인스턴스 페이지로 돌아가서 Public IPv4 address가 탄력적 IP와 일치하는지 확인

> ⚠️ **중요**: 
> - 탄력적 IP를 생성했지만 인스턴스에 연결하지 않으면 시간당 약 $0.005 과금됩니다
> - 인스턴스를 종료하면 탄력적 IP를 해제하거나 다른 인스턴스에 연결해야 합니다

---

## 6. SSH 접속 테스트

### 6-1. 키 파일 권한 설정 (Mac/Linux)

> ⚠️ **중요**: 키 파일 권한을 설정하지 않으면 SSH 접속이 거부됩니다.

터미널에서 다음 명령 실행:

```bash
# 키 파일이 다운로드 폴더에 있다고 가정
chmod 400 ~/Downloads/blog-api-key.pem

# 권한 확인
ls -l ~/Downloads/blog-api-key.pem
# 출력 예시: -r--------  1 user  staff  1692 Jan  1 12:00 blog-api-key.pem
```

### 6-2. SSH 접속 명령

1. EC2 Instances 페이지에서 `blog-api` 인스턴스 선택
2. **"Connect"** 버튼 클릭
3. **"SSH client"** 탭 확인
4. 표시된 SSH 명령 복사 (예시):

```bash
ssh -i "blog-api-key.pem" ubuntu@ec2-3-34-123-45.ap-northeast-2.compute.amazonaws.com
```

5. 터미널에서 명령 실행 (경로 수정 필요):

```bash
# 키 파일 경로를 절대 경로로 지정
ssh -i ~/Downloads/blog-api-key.pem ubuntu@3.34.123.45

# 또는 탄력적 IP를 사용한 경우
ssh -i ~/Downloads/blog-api-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 6-3. 첫 접속 시 확인 메시지

처음 접속할 때 다음과 같은 메시지가 나타날 수 있습니다:

```
The authenticity of host '3.34.123.45 (3.34.123.45)' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])? 
```

**`yes`** 입력 후 Enter

### 6-4. 접속 성공 확인

성공적으로 접속되면 다음과 같은 메시지가 표시됩니다:

```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-...)

...

ubuntu@ip-172-31-xx-xx:~$
```

### 6-5. 접속 테스트 명령

서버에 접속한 후 다음 명령으로 확인:

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

### 6-6. 접속 종료

```bash
exit
```

---

## 7. 예산 알림 설정 (중요)

> ⚠️ **매우 중요**: 예상치 못한 과금을 방지하기 위해 반드시 설정하세요.

### 7-1. Billing 대시보드 접속

1. AWS 콘솔 상단 검색창에 `Billing` 입력
2. **"Billing"** 클릭
   - 또는 직접 링크: https://console.aws.amazon.com/billing/

### 7-2. Budgets 메뉴 접속

1. 왼쪽 메뉴에서 **"Budgets"** 클릭
2. **"Create budget"** 버튼 클릭

### 7-3. Budget 설정

1. **Budget type** 선택:
   - **"Cost budget"** 선택 (기본 선택됨)
   - **"Next"** 클릭

2. **Budget setup**:
   - **Budget name**: `Blog API Monthly Budget` 입력
   - **Period**: `Monthly` 선택
   - **Budget effective period**: `Recurring budget` 선택
   - **Budget amount**: `Fixed` 선택
   - **Budgeted amount**: `1.00` 입력 (USD)

3. **"Next"** 클릭

### 7-4. 알림 설정

1. **"Configure alerts"** 섹션:
   - **Alert 1**:
     - **Alert threshold**: `50` (50% 도달 시)
     - **Email recipients**: 본인 이메일 주소 입력 (여러 개 가능, 쉼표로 구분)
   - **"Add another alert"** 클릭
   - **Alert 2**:
     - **Alert threshold**: `80` (80% 도달 시)
     - **Email recipients**: 동일한 이메일 주소 입력
   - **"Add another alert"** 클릭
   - **Alert 3**:
     - **Alert threshold**: `100` (100% 도달 시)
     - **Email recipients**: 동일한 이메일 주소 입력

2. **"Next"** 클릭

### 7-5. 예산 생성 완료

1. 설정 요약 확인
2. **"Create budget"** 버튼 클릭
3. 예산 생성 완료 확인:
   - "Successfully created budget" 메시지 확인
   - Budgets 목록에 `Blog API Monthly Budget` 표시

> 💡 **참고**: 
> - 예산 알림은 실제 사용량이 임계값에 도달하면 이메일로 알림을 보냅니다
> - Free Tier 범위 내에서는 알림이 오지 않을 수 있습니다
> - 예산을 초과해도 자동으로 서비스가 중단되지는 않습니다 (알림만 전송)

---

## 8. 체크리스트 및 문제 해결

### 8-1. 최종 체크리스트

#### AWS 계정
- [ ] AWS 계정 생성 완료
- [ ] 결제 정보 등록 완료
- [ ] 이메일 인증 완료

#### 리전 설정
- [ ] 리전이 `ap-northeast-2` (Seoul)로 설정됨

#### EC2 인스턴스
- [ ] Ubuntu 22.04 LTS AMI 선택
- [ ] t2.micro 인스턴스 타입 선택
- [ ] 키 페어 생성 및 다운로드 완료
- [ ] 키 파일을 안전한 곳에 보관
- [ ] VPC 및 Subnet 설정 완료 (기본 VPC 또는 새로 생성)
- [ ] Auto-assign Public IP: Enable 설정
- [ ] 30GB gp3 스토리지 설정
- [ ] 인스턴스 상태가 `running`
- [ ] Status check가 `2/2 checks passed`

#### 보안 그룹
- [ ] SSH (22번 포트) - My IP만 허용
- [ ] HTTP (80번 포트) - 모든 IP 허용
- [ ] HTTPS (443번 포트) - 모든 IP 허용

#### 네트워크
- [ ] Public IP 주소 확인
- [ ] 탄력적 IP 할당 및 연결 (선택사항)
- [ ] SSH 접속 테스트 성공

#### 보안
- [ ] 예산 알림 설정 완료 ($1 임계값)
- [ ] 키 파일 권한 설정 (chmod 400)
- [ ] 루트 계정 MFA 활성화 (권장)

### 8-2. 자주 발생하는 문제 해결

#### 문제 1: SSH 접속이 안 될 때

**증상**: `Permission denied (publickey)` 오류

**해결 방법**:

1. **키 파일 권한 확인**:
   ```bash
   ls -l blog-api-key.pem
   # 출력이 -r-------- 이어야 함
   
   # 권한 수정
   chmod 400 blog-api-key.pem
   ```

2. **키 파일 경로 확인**:
   ```bash
   # 절대 경로 사용 권장
   ssh -i /full/path/to/blog-api-key.pem ubuntu@YOUR_IP
   ```

3. **사용자 이름 확인**:
   - Ubuntu AMI는 `ubuntu` 사용자 사용
   - Amazon Linux AMI는 `ec2-user` 사용

4. **보안 그룹 확인**:
   - SSH 규칙이 있는지 확인
   - Source가 올바른지 확인 (My IP 또는 특정 IP)

5. **인스턴스 상태 확인**:
   - 인스턴스가 `running` 상태인지 확인
   - Status check가 완료되었는지 확인

6. **디버깅 모드로 접속 시도**:
   ```bash
   ssh -v -i blog-api-key.pem ubuntu@YOUR_IP
   # -v 옵션으로 상세 로그 확인
   ```

#### 문제 2: "My IP"가 자동으로 변경되지 않을 때

**해결 방법**:

1. 현재 IP 주소 확인:
   - 브라우저에서 https://whatismyipaddress.com 접속
   - 또는 터미널에서: `curl ifconfig.me`

2. 보안 그룹에서 수동으로 IP 추가:
   - Source type: `Custom` 선택
   - Source: `YOUR_IP/32` 입력 (예: `123.456.789.0/32`)

#### 문제 3: 인스턴스가 시작되지 않을 때

**증상**: 인스턴스 상태가 `pending`에서 멈춤

**해결 방법**:

1. **인스턴스 상태 확인**:
   - 인스턴스 선택 → "Status checks" 탭 확인
   - "System status check" 실패 시 AWS 지원 문의

2. **인스턴스 재시작**:
   - 인스턴스 선택 → "Instance state" → "Reboot instance"

3. **리소스 제한 확인**:
   - AWS 계정의 EC2 인스턴스 제한 확인
   - 필요 시 AWS 지원에 제한 증가 요청

#### 문제 4: 탄력적 IP가 과금될 때

**증상**: 예상치 못한 과금 발생

**해결 방법**:

1. **탄력적 IP 확인**:
   - EC2 → Elastic IPs 메뉴에서 할당된 IP 확인
   - "Associated instance" 컬럼 확인

2. **미연결 IP 해제**:
   - 연결되지 않은 탄력적 IP 선택
   - "Actions" → "Release Elastic IP address"
   - 확인 메시지에서 "Release" 클릭

#### 문제 5: 예산 알림이 오지 않을 때

**해결 방법**:

1. **예산 설정 확인**:
   - Billing → Budgets 메뉴에서 예산 확인
   - 알림 설정이 올바른지 확인

2. **이메일 주소 확인**:
   - 알림에 등록한 이메일 주소 확인
   - 스팸 폴더 확인

3. **사용량 확인**:
   - Billing → Cost Explorer에서 실제 사용량 확인
   - Free Tier 범위 내라면 알림이 오지 않을 수 있음

#### 문제 6: Subnet 드롭다운이 "기본설정없음"으로 표시될 때

**증상**: 
- VPC는 선택되었지만 Subnet 드롭다운에 "기본설정없음" 또는 "No subnets available" 표시
- Availability Zone도 "기본설정없음"으로 표시

**원인**: 
- 기본 VPC는 있지만 해당 VPC에 서브넷이 생성되지 않은 경우
- 또는 서브넷이 있지만 다른 가용영역에만 있는 경우

**해결 방법**:

1. **서브넷 생성** (가장 일반적인 해결책):
   - 위의 [3-7. Network settings 설정](#3-7-network-settings-설정) 섹션의 "경우 2" 참고
   - VPC 대시보드 → Your VPCs에서 기본 VPC의 CIDR 블록 확인
   - VPC 대시보드 → Subnets 메뉴에서 서브넷 생성
   - 기본 VPC를 선택하고 가용영역(예: ap-northeast-2a) 선택
   - **CIDR 블록은 반드시 VPC CIDR 범위 내에서 설정하고, 기존 서브넷과 중첩되지 않아야 함**:
     - VPC가 `172.31.0.0/16`이면:
       - **먼저 확인**: VPC 대시보드 → Subnets에서 기존 서브넷 확인
       - **기존 서브넷이 없는 경우**:
         - 플레이스홀더로 `172.31.0.0/20`이 제안되면 그대로 사용 ✅ (권장)
         - 또는 `172.31.16.0/20`, `172.31.32.0/20` 등 사용 가능
       - **기존 서브넷이 `172.31.0.0/20`으로 이미 있는 경우**:
         - ⚠️ **`172.31.1.0/24`는 사용할 수 없습니다!** (중첩됨)
         - ✅ **해결책 1 (권장)**: 서브넷을 새로 생성하지 말고, EC2 인스턴스 생성 페이지로 돌아가서 기존 서브넷 선택
         - ✅ **해결책 2**: 다른 CIDR 사용: `172.31.16.0/20`, `172.31.32.0/20` 등
       - **⚠️ 오류 발생 시**: "CIDR 주소가 기존 서브넷 CIDR: 172.31.0.0/20과(와) 중첩됩니다" 오류가 나면
         - 이미 해당 서브넷이 존재한다는 의미입니다
         - 서브넷 생성 창을 닫고 EC2 인스턴스 생성 페이지로 돌아가서 기존 서브넷을 선택하세요 (권장)
     - VPC가 `10.0.0.0/16`이면:
       - 기존 서브넷이 없다면: `10.0.1.0/24` 또는 `10.0.0.0/20` 사용
       - 기존 서브넷이 있다면: 중첩되지 않는 다른 범위 사용 (예: `10.0.16.0/20`)
   - EC2 인스턴스 생성 페이지로 돌아가서 새로 생성한 서브넷 선택

2. **인터넷 게이트웨이 확인**:
   - VPC → Internet Gateways 메뉴에서 기본 VPC에 연결된 인터넷 게이트웨이 확인
   - 없다면 생성하고 VPC에 연결
   - 위의 "경우 2" 해결 방법 참고

3. **라우팅 테이블 확인**:
   - VPC → Route Tables 메뉴에서 기본 VPC의 라우팅 테이블 확인
   - `0.0.0.0/0` → 인터넷 게이트웨이로 가는 라우트가 있는지 확인
   - 없다면 라우트 추가 필요

4. **다른 가용영역의 서브넷 확인**:
   - VPC → Subnets 메뉴에서 기본 VPC의 모든 서브넷 확인
   - 다른 가용영역(예: ap-northeast-2b, ap-northeast-2c)에 서브넷이 있다면 사용 가능
   - EC2 인스턴스 생성 시 해당 서브넷 선택

> 💡 **참고**: 
> - 기본 VPC를 생성하면 인터넷 게이트웨이와 라우팅 테이블이 자동으로 설정되지만, 서브넷은 수동으로 생성해야 할 수 있습니다
> - 서브넷을 생성할 때는 반드시 가용영역을 선택해야 합니다
> - Public IP 자동 할당을 활성화해야 외부에서 접속할 수 있습니다

#### 문제 7: 기본 VPC가 없는 경우

**증상**: VPC 드롭다운이 비어있거나 "No VPCs available" 메시지 표시

**해결 방법**:

1. **기본 VPC 생성** (권장):
   - 위의 [3-7. Network settings 설정](#3-7-network-settings-설정) 섹션의 "경우 3" 참고
   - VPC 대시보드에서 기본 VPC와 서브넷 생성
   - EC2 인스턴스 생성 페이지로 돌아가서 새로 생성한 VPC와 서브넷 선택

2. **기존 VPC 확인**:
   - VPC 대시보드에서 기존 VPC가 있는지 확인
   - 있다면 해당 VPC의 서브넷이 있는지 확인
   - 서브넷이 없다면 서브넷 생성 필요

#### 문제 8: 서브넷 생성 시 "CIDR 주소가 기존 서브넷 CIDR과 중첩됩니다" 오류

**증상**: 
- 서브넷 생성 페이지에서 CIDR 블록을 입력하고 "Create subnet" 버튼을 클릭하면
- 빨간색 오류 메시지: "CIDR address overlaps with existing subnet CIDR: 172.31.0.0/20" 표시
- 서브넷 생성이 완료되지 않음

**원인**: 
- 입력한 서브넷 CIDR 블록이 이미 존재하는 서브넷의 CIDR 범위와 겹침
- 예: 기존 서브넷이 `172.31.0.0/20` (172.31.0.0 ~ 172.31.15.255)인데, `172.31.1.0/24` (172.31.1.0 ~ 172.31.1.255)를 입력하면 중첩됨

**즉시 해결 방법** (가장 간단하고 권장):

1. **서브넷 생성 창을 닫으세요**
   - "Cancel" 버튼 또는 X 버튼 클릭

2. **EC2 인스턴스 생성 페이지로 돌아가세요**
   - 브라우저 탭에서 EC2 인스턴스 생성 페이지로 이동

3. **Network settings 수정**:
   - **"Network settings"** 섹션에서 **"Edit"** 버튼 클릭
   - **Subnet** 드롭다운을 클릭
   - 기존 서브넷 목록이 표시됩니다 (예: `subnet-xxxxx (172.31.0.0/20)`)
   - **기존 서브넷을 선택하세요** ✅
   - **Auto-assign Public IP**: `Enable` 선택 (중요!)
   - **"Save"** 또는 **"Done"** 클릭

4. **인스턴스 생성을 계속 진행하세요**
   - 기존 서브넷을 사용하면 문제없이 인스턴스를 생성할 수 있습니다

**대안 해결 방법** (새로운 서브넷이 정말 필요한 경우):

1. **VPC 대시보드에서 기존 서브넷 확인**:
   - VPC 대시보드 → Subnets 메뉴로 이동
   - 기본 VPC의 모든 서브넷과 CIDR 블록 확인

2. **중첩되지 않는 새로운 CIDR 블록 선택**:
   - VPC CIDR이 `172.31.0.0/16`인 경우:
     - 기존 서브넷이 `172.31.0.0/20` (0-15)이면
     - 다음 사용 가능한 블록: `172.31.16.0/20` (16-31) ✅
     - 또는 `172.31.32.0/20` (32-47), `172.31.48.0/20` (48-63) 등
   - 각 `/20` 블록은 4,096개의 IP를 제공하므로 충분합니다

3. **새 서브넷 생성**:
   - 서브넷 생성 페이지에서:
     - **Subnet name**: `default-subnet-1b` (또는 다른 이름)
     - **Availability Zone**: `ap-northeast-2b` (다른 가용영역 선택)
     - **IPv4 CIDR block**: `172.31.16.0/20` 입력
     - **"Create subnet"** 클릭

4. **EC2 인스턴스 생성 페이지에서 새 서브넷 선택**

> 💡 **중요 팁**: 
> - 대부분의 경우 기존 서브넷을 사용하는 것이 가장 간단합니다
> - 기존 서브넷(`172.31.0.0/20`)은 4,096개의 IP를 제공하므로 충분합니다
> - 새로운 서브넷이 꼭 필요하지 않다면 기존 서브넷을 사용하세요!

### 8-3. 유용한 AWS CLI 명령어 (선택사항)

AWS CLI를 설치한 경우 다음 명령어 사용 가능:

```bash
# 인스턴스 상태 확인
aws ec2 describe-instances --instance-ids i-0123456789abcdef0

# 보안 그룹 규칙 확인
aws ec2 describe-security-groups --group-names blog-api-sg

# 탄력적 IP 확인
aws ec2 describe-addresses
```

---

## 다음 단계

EC2 인스턴스 생성이 완료되었습니다! 다음 단계로 진행하세요:

1. **서버 환경 구성**: [백엔드 배포 가이드](./backend-deployment.md)의 Part 3 참고
   - 시스템 업데이트 및 필수 패키지 설치
   - PostgreSQL 설치 및 데이터베이스 생성
   - 프로젝트 클론 및 환경 변수 설정

2. **서비스 설정**: [백엔드 배포 가이드](./backend-deployment.md)의 Part 4-6 참고
   - Gunicorn 서비스 설정
   - Nginx 리버스 프록시 설정
   - SSL 인증서 발급

---

## 참고 자료

- [AWS Free Tier 가이드](./aws-free-tier-guide.md)
- [백엔드 배포 가이드](./backend-deployment.md)
- [AWS EC2 공식 문서](https://docs.aws.amazon.com/ec2/)
- [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)

---

## 문의 및 지원

문제가 발생하거나 도움이 필요한 경우:

1. AWS Support Center: https://console.aws.amazon.com/support/
2. AWS 문서: https://docs.aws.amazon.com/
3. AWS 커뮤니티 포럼: https://forums.aws.amazon.com/

---

**작성일**: 2024년  
**최종 업데이트**: 2024년  
**문서 버전**: 1.0

