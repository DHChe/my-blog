# AWS Free Tier 활용 가이드

## 개요

AWS Free Tier를 효율적으로 활용하여 포트폴리오 백엔드를 무료로 운영하는 방법을 설명합니다.

## Free Tier 유형

AWS Free Tier는 세 가지 유형이 있습니다:

| 유형 | 설명 | 예시 |
|------|------|------|
| **12개월 무료** | 가입 후 12개월간 무료 | EC2, RDS, S3 |
| **항상 무료** | 기간 제한 없이 무료 | Lambda, DynamoDB (일부) |
| **단기 평가판** | 서비스별 단기 무료 체험 | SageMaker, Redshift |

## 주요 서비스별 Free Tier 한도

### EC2 (Elastic Compute Cloud)

| 항목 | 무료 한도 | 주의사항 |
|------|-----------|----------|
| 인스턴스 타입 | t2.micro 또는 t3.micro | 리전에 따라 상이 |
| 사용 시간 | 750시간/월 | 모든 t2.micro 인스턴스 합산 |
| 기간 | 12개월 | 가입일 기준 |

**계산 예시:**
- 1개 인스턴스 24시간 가동 = 720시간/월 (무료 범위 내)
- 2개 인스턴스 24시간 가동 = 1,440시간/월 (690시간 초과 과금)

### EBS (Elastic Block Store)

| 항목 | 무료 한도 |
|------|-----------|
| 스토리지 | 30 GB (gp2/gp3) |
| IOPS | 3,000 IOPS (gp3) |
| 스냅샷 | 1 GB |

**권장 설정:**
- 루트 볼륨: 20-30 GB gp3
- 스냅샷은 최소한으로 유지

### RDS (Relational Database Service)

| 항목 | 무료 한도 |
|------|-----------|
| 인스턴스 타입 | db.t2.micro 또는 db.t3.micro |
| 사용 시간 | 750시간/월 |
| 스토리지 | 20 GB (gp2) |
| 백업 | 20 GB |
| 기간 | 12개월 |

**비용 절감 대안:**
EC2 내 PostgreSQL 설치 시 RDS 비용 없이 운영 가능

### 데이터 전송

| 방향 | 무료 한도 |
|------|-----------|
| 인바운드 | 무제한 |
| 아웃바운드 (인터넷) | 100 GB/월 |
| 리전 간 | 유료 |

### S3 (Simple Storage Service)

| 항목 | 무료 한도 |
|------|-----------|
| 스토리지 | 5 GB |
| GET 요청 | 20,000회/월 |
| PUT 요청 | 2,000회/월 |
| 기간 | 12개월 |

### Lambda

| 항목 | 무료 한도 (항상 무료) |
|------|-----------|
| 요청 | 100만 회/월 |
| 컴퓨팅 | 400,000 GB-초/월 |

### CloudWatch

| 항목 | 무료 한도 |
|------|-----------|
| 기본 모니터링 | 무료 (5분 간격) |
| 커스텀 메트릭 | 10개 |
| 알람 | 10개 |
| 로그 데이터 | 5 GB |

## 포트폴리오용 권장 아키텍처

### 최소 비용 구성

```
┌─────────────────────────────────────────┐
│           AWS EC2 (t2.micro)            │
│  ┌─────────────────────────────────┐    │
│  │         Ubuntu 22.04            │    │
│  │  ┌────────────┐ ┌────────────┐  │    │
│  │  │   Nginx    │ │ PostgreSQL │  │    │
│  │  └─────┬──────┘ └────────────┘  │    │
│  │        │                        │    │
│  │  ┌─────▼──────────────────┐     │    │
│  │  │  Gunicorn + FastAPI    │     │    │
│  │  └────────────────────────┘     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  EBS: 30 GB gp3                         │
└─────────────────────────────────────────┘

예상 월 비용: $0 (Free Tier 기간)
```

### 서비스별 비용 비교

| 구성 요소 | EC2 내 설치 | 관리형 서비스 |
|-----------|-------------|---------------|
| 웹 서버 | Nginx (무료) | ALB ($16+/월) |
| 데이터베이스 | PostgreSQL (무료) | RDS (12개월 후 유료) |
| SSL | Let's Encrypt (무료) | ACM (무료, ALB 필요) |
| 모니터링 | CloudWatch 기본 (무료) | 상세 모니터링 (유료) |

## 비용 발생 주의 사항

### 흔한 실수들

| 실수 | 결과 | 방지 방법 |
|------|------|-----------|
| 탄력적 IP 미연결 | $0.005/시간 | 사용 안 하면 해제 |
| 인스턴스 중지 후 EBS 유지 | 스토리지 요금 | 필요 없으면 삭제 |
| 여러 리전에 리소스 생성 | 각 리전별 과금 | 단일 리전 사용 |
| t2.micro 외 인스턴스 | 즉시 과금 | 인스턴스 타입 확인 |
| RDS Multi-AZ | 2배 과금 | 단일 AZ 사용 |
| 스냅샷 누적 | 스토리지 요금 | 오래된 스냅샷 삭제 |

### 탄력적 IP 비용

| 상태 | 비용 |
|------|------|
| 실행 중인 인스턴스에 연결 | 무료 |
| 연결되지 않음 | $0.005/시간 (~$3.6/월) |
| 중지된 인스턴스에 연결 | $0.005/시간 |

## 예산 알림 설정

### Step 1: AWS Budgets 설정

1. AWS 콘솔 → Billing → Budgets
2. "Create budget" 클릭
3. "Cost budget" 선택
4. 예산 설정:
   - Budget name: `Portfolio Monthly Budget`
   - Period: Monthly
   - Budget amount: $1.00

### Step 2: 알림 임계값 설정

| 임계값 | 알림 |
|--------|------|
| 50% | 이메일 알림 |
| 80% | 이메일 알림 |
| 100% | 이메일 + SMS |

### Step 3: CloudWatch 결제 알림

```bash
# AWS CLI로 결제 알림 활성화
aws ce put-anomaly-subscription \
  --threshold-expression "ANOMALY_TOTAL_IMPACT_PERCENTAGE > 50" \
  --subscription-name "billing-anomaly-alert"
```

## 12개월 이후 전략

### 비용 예상 (Free Tier 종료 후)

| 서비스 | 월 비용 (예상) |
|--------|---------------|
| EC2 t2.micro (On-Demand) | ~$8.50 |
| EBS 30GB | ~$2.40 |
| 데이터 전송 100GB | ~$9.00 |
| **총합** | **~$20/월** |

### 비용 절감 옵션

#### 1. 예약 인스턴스 (1년 약정)

```
On-Demand: $8.50/월
예약 인스턴스 (전체 선결제): ~$4.50/월 (47% 절감)
```

#### 2. Spot 인스턴스 (개발/테스트용)

```
On-Demand: $8.50/월
Spot: ~$2.50/월 (70% 절감)
※ 중단 가능성 있음, 프로덕션 비권장
```

#### 3. 대안 플랫폼 고려

| 플랫폼 | 무료 티어 | 특징 |
|--------|-----------|------|
| Railway | $5 크레딧/월 | 간편한 배포 |
| Render | 750시간/월 | 자동 SSL |
| Fly.io | 3 shared-cpu-1x VMs | 글로벌 배포 |
| Oracle Cloud | 항상 무료 4 ARM CPUs | 높은 스펙 |

## 리소스 정리 스크립트

### 미사용 리소스 확인

```bash
#!/bin/bash
# unused-resources.sh

echo "=== 미사용 EBS 볼륨 ==="
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,CreateTime]' \
  --output table

echo "=== 미연결 탄력적 IP ==="
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' \
  --output table

echo "=== 오래된 스냅샷 (30일 이상) ==="
aws ec2 describe-snapshots \
  --owner-ids self \
  --query 'Snapshots[?StartTime<=`'"$(date -d '30 days ago' --iso-8601)"'`].[SnapshotId,VolumeSize,StartTime]' \
  --output table
```

### 리소스 삭제 (주의)

```bash
# 미사용 EBS 볼륨 삭제
aws ec2 delete-volume --volume-id vol-xxxxxxxx

# 미연결 탄력적 IP 해제
aws ec2 release-address --allocation-id eipalloc-xxxxxxxx

# 스냅샷 삭제
aws ec2 delete-snapshot --snapshot-id snap-xxxxxxxx
```

## Free Tier 만료 알림 설정

### 달력 알림

```
제목: AWS Free Tier 만료 30일 전
날짜: [가입일 + 11개월]
내용:
- RDS Free Tier 종료 예정
- 비용 절감 방안 검토
- 대안 플랫폼 평가
```

### AWS 자체 알림

1. AWS 콘솔 → Billing → Free Tier
2. Free Tier 사용량 모니터링
3. 사용량 85% 도달 시 이메일 알림

## 체크리스트

### 초기 설정

- [ ] IAM 사용자 생성 (루트 계정 사용 금지)
- [ ] MFA 활성화
- [ ] 예산 알림 설정 ($1 임계값)
- [ ] 단일 리전 선택 (ap-northeast-2 권장)

### 월간 점검

- [ ] Billing 대시보드 확인
- [ ] 미사용 리소스 정리
- [ ] Free Tier 사용량 확인
- [ ] 스냅샷/백업 정리

### Free Tier 종료 전

- [ ] 비용 예측 검토
- [ ] 예약 인스턴스 검토
- [ ] 대안 플랫폼 평가
- [ ] 마이그레이션 계획 수립

## 유용한 AWS CLI 명령어

```bash
# Free Tier 사용량 확인
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "UsageQuantity" "BlendedCost"

# 실행 중인 인스턴스 확인
aws ec2 describe-instances \
  --filters Name=instance-state-name,Values=running \
  --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name]' \
  --output table

# 현재 예상 비용 확인
aws ce get-cost-forecast \
  --time-period Start=$(date +%Y-%m-%d),End=$(date -d 'next month' +%Y-%m-01) \
  --metric BLENDED_COST \
  --granularity MONTHLY
```

## 관련 문서

- [AWS Free Tier 공식 페이지](https://aws.amazon.com/free/)
- [AWS 요금 계산기](https://calculator.aws/)
- [배포 전략 개요](./deployment-strategy.md)
- [백엔드 배포 가이드](./backend-deployment.md)
