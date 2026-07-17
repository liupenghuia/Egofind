# Database — egofind

ORM: Prisma · DB: MySQL 8  
设计细节见 [product-design.md](./product-design.md) §5。

## Core tables

| Table | Purpose |
| --- | --- |
| users | 微信/管理员用户；phoneEnc/phoneMask；activeMode |
| roles / permissions / user_roles / role_permissions | RBAC |
| driver_profiles | 车辆与认证状态快照 |
| driver_trips | 车找人 |
| passenger_requests | 人找车（visibility） |
| match_orders | 确认同行 |
| driver_verifications | 司机认证申请 |
| reports / reviews / notifications | 安全与互动 |
| phone_access_logs | 手机号访问审计 |

## Enums

- TripStatus: PUBLISHED | MATCHING | CONFIRMED | COMPLETED | CANCELLED | EXPIRED  
- Visibility: PUBLIC | HIDDEN  
- VerifyStatus: NONE | PENDING | APPROVED | REJECTED  
- MatchStatus: CONFIRMED | COMPLETED | CANCELLED  
- ActiveMode: PASSENGER | DRIVER  

## Indexes (key)

- driver_trips(origin_adcode, status, depart_start)
- passenger_requests(origin_adcode, status, visibility, expect_start)
- match_orders unique(driver_trip_id, passenger_request_id)

## Migrate

```bash
cd backend
pnpm prisma:generate
pnpm prisma migrate deploy   # or prisma migrate dev --name add_ride_domain
pnpm prisma:seed
```
