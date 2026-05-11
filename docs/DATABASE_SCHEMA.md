# MediCore Database Schema Documentation

## Overview

The MediCore platform uses PostgreSQL as its primary database with a well-structured schema designed for scalability, performance, and data integrity.

## Entity Relationship Diagram (ERD)

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│    users    │       │   doctors   │       │   patients   │
├─────────────┤       ├─────────────┤       ├──────────────┤
│ id (PK)     │──────▶│ id (PK)     │       │ id (PK)      │
│ email       │       │ userId (FK) │       │ userId (FK)   │
│ password    │       │ fullName    │       │ fullName      │
│ role        │       │ specialization│      │ dateOfBirth   │
│ isActive    │       │ experience  │       │ gender        │
│ isVerified  │       │ consultationFee│    │ phone         │
│ createdAt   │       │ rating      │       │ bloodGroup    │
│ updatedAt   │       │ isVerified  │       │ createdAt     │
└─────────────┘       └─────────────┘       └──────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│refresh_tokens│      │ appointments │       │ schedules     │
├─────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)     │       │ id (PK)      │       │ id (PK)      │
│ token       │       │ patientId(FK)│       │ doctorId(FK) │
│ userId (FK) │       │ doctorId(FK) │       │ dayOfWeek    │
│ expiresAt   │       │ slotId(FK)   │       │ startTime    │
│ revokedAt   │       │ status       │       │ endTime      │
└─────────────┘       │ paymentId(FK)│       │ slotDuration │
                       │ idempotencyKey│      └──────────────┘
                       └──────────────┘              │
                              │                      │
                              │                      │
                              ▼                      ▼
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│  payments   │       │appointment_slots│    │unavailable_dates│
├─────────────┤       ├──────────────┤       ├──────────────┐
│ id (PK)     │       │ id (PK)      │       │ id (PK)      │
│ appointmentId│      │ scheduleId(FK)│      │ doctorId(FK) │
│ amount      │       │ doctorId(FK) │       │ date         │
│ currency    │       │ date         │       │ reason       │
│ status      │       │ startTime    │       └──────────────┘
│ transactionId│      │ endTime      │
│ paymentIntentId│    │ status       │
└─────────────┘       └──────────────┘

┌─────────────┐       ┌─────────────┐
│notifications│       │  audit_logs │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ userId (FK) │       │ userId (FK) │
│ type        │       │ action      │
│ channel     │       │ entity      │
│ title       │       │ entityId    │
│ message     │       │ changes     │
│ isRead      │       │ ipAddress   │
│ readAt      │       │ userAgent   │
└─────────────┘       └─────────────┘
```

## Core Tables

### 1. users

Stores all user accounts regardless of role.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| email | VARCHAR | UNIQUE | User email address |
| password | VARCHAR | NOT NULL | Hashed password (bcrypt) |
| role | ENUM | NOT NULL | ADMIN, DOCTOR, PATIENT |
| isActive | BOOLEAN | DEFAULT true | Account status |
| isVerified | BOOLEAN | DEFAULT false | Email verification status |
| emailVerified | TIMESTAMP | NULLABLE | Verification timestamp |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete |

**Indexes**:
- `email` (unique)
- `role`
- `isActive`

### 2. doctors

Extended profile for doctor users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | UNIQUE, FK → users.id | User account reference |
| fullName | VARCHAR | NOT NULL | Doctor's full name |
| specialization | VARCHAR | NOT NULL | Medical specialization |
| experience | INTEGER | DEFAULT 0 | Years of experience |
| qualification | VARCHAR | NOT NULL | Medical qualification |
| consultationFee | DECIMAL | NOT NULL | Fee per consultation |
| bio | TEXT | NULLABLE | Professional bio |
| languages | TEXT[] | ARRAY | Spoken languages |
| rating | DECIMAL | DEFAULT 0 | Average rating (0-5) |
| totalReviews | INTEGER | DEFAULT 0 | Total review count |
| clinicLocation | VARCHAR | NULLABLE | Clinic location |
| clinicAddress | TEXT | NULLABLE | Full address |
| consultationDuration | INTEGER | DEFAULT 30 | Duration in minutes |
| profileImage | VARCHAR | NULLABLE | Profile photo URL |
| isVerified | BOOLEAN | DEFAULT false | Admin verification |
| verificationDate | TIMESTAMP | NULLABLE | Verification timestamp |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete |

**Indexes**:
- `userId` (unique)
- `specialization`
- `rating`
- `isVerified`

### 3. patients

Extended profile for patient users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | UNIQUE, FK → users.id | User account reference |
| fullName | VARCHAR | NOT NULL | Patient's full name |
| dateOfBirth | DATE | NULLABLE | Date of birth |
| gender | VARCHAR | NULLABLE | Gender |
| phone | VARCHAR | NULLABLE | Phone number |
| address | TEXT | NULLABLE | Home address |
| bloodGroup | VARCHAR | NULLABLE | Blood type |
| allergies | TEXT | NULLABLE | Known allergies |
| emergencyContact | VARCHAR | NULLABLE | Emergency contact |
| profileImage | VARCHAR | NULLABLE | Profile photo URL |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete |

**Indexes**:
- `userId` (unique)

### 4. schedules

Weekly recurring schedules for doctors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| doctorId | UUID | FK → doctors.id | Doctor reference |
| dayOfWeek | INTEGER | NOT NULL | 0-6 (Sunday-Saturday) |
| startTime | VARCHAR | NOT NULL | HH:MM format |
| endTime | VARCHAR | NOT NULL | HH:MM format |
| slotDuration | INTEGER | DEFAULT 30 | Duration in minutes |
| isActive | BOOLEAN | DEFAULT true | Schedule status |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |

**Indexes**:
- `doctorId_dayOfWeek` (unique)
- `doctorId`

### 5. unavailable_dates

Blocked dates for doctors (vacations, holidays).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| doctorId | UUID | FK → doctors.id | Doctor reference |
| date | DATE | NOT NULL | Blocked date |
| reason | TEXT | NULLABLE | Reason for blocking |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- `doctorId_date` (unique)
- `doctorId`
- `date`

### 6. appointment_slots

Individual time slots generated from schedules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| scheduleId | UUID | FK → schedules.id | Parent schedule |
| doctorId | UUID | FK → doctors.id | Doctor reference |
| date | DATE | NOT NULL | Slot date |
| startTime | VARCHAR | NOT NULL | HH:MM format |
| endTime | VARCHAR | NOT NULL | HH:MM format |
| status | ENUM | DEFAULT AVAILABLE | AVAILABLE, RESERVED, BOOKED, CANCELLED, EXPIRED |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |

**Indexes**:
- `doctorId_date_startTime` (unique)
- `doctorId`
- `date`
- `status`

### 7. appointments

Appointment bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| patientId | UUID | FK → patients.id | Patient reference |
| doctorId | UUID | FK → doctors.id | Doctor reference |
| slotId | UUID | UNIQUE, FK → appointment_slots.id | Booked slot |
| status | ENUM | DEFAULT PENDING | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, REFUNDED |
| reason | TEXT | NULLABLE | Visit reason |
| symptoms | TEXT | NULLABLE | Symptoms description |
| notes | TEXT | NULLABLE | Doctor notes |
| idempotencyKey | VARCHAR | UNIQUE | Prevent duplicates |
| paymentId | UUID | FK → payments.id | Payment reference |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |
| cancelledAt | TIMESTAMP | NULLABLE | Cancellation time |
| completedAt | TIMESTAMP | NULLABLE | Completion time |

**Indexes**:
- `patientId`
- `doctorId`
- `slotId` (unique)
- `status`
- `createdAt`
- `idempotencyKey` (unique)

### 8. payments

Payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| appointmentId | UUID | UNIQUE, FK → appointments.id | Associated appointment |
| amount | DECIMAL | NOT NULL | Payment amount |
| currency | VARCHAR | DEFAULT USD | Currency code |
| status | ENUM | DEFAULT INITIATED | INITIATED, SUCCESS, FAILED, REFUNDED |
| paymentMethod | VARCHAR | DEFAULT stripe | Payment method |
| transactionId | VARCHAR | UNIQUE | External transaction ID |
| paymentIntentId | VARCHAR | NULLABLE | Stripe payment intent ID |
| failureReason | TEXT | NULLABLE | Failure description |
| refundedAt | TIMESTAMP | NULLABLE | Refund timestamp |
| idempotencyKey | VARCHAR | UNIQUE | Prevent duplicates |
| metadata | JSONB | NULLABLE | Additional data |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |

**Indexes**:
- `appointmentId` (unique)
- `transactionId` (unique)
- `status`
- `createdAt`
- `idempotencyKey` (unique)

### 9. notifications

User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | FK → users.id | User reference |
| type | ENUM | NOT NULL | Notification type |
| channel | ENUM | NOT NULL | EMAIL, PUSH, IN_APP |
| title | VARCHAR | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| isRead | BOOLEAN | DEFAULT false | Read status |
| readAt | TIMESTAMP | NULLABLE | Read timestamp |
| metadata | JSONB | NULLABLE | Additional data |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- `userId`
- `isRead`
- `createdAt`

### 10. refresh_tokens

JWT refresh tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| token | VARCHAR | UNIQUE | Token hash |
| userId | UUID | FK → users.id | User reference |
| expiresAt | TIMESTAMP | NOT NULL | Expiration time |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| revokedAt | TIMESTAMP | NULLABLE | Revocation time |

**Indexes**:
- `token` (unique)
- `userId`

### 11. audit_logs

System audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | FK → users.id | Acting user |
| action | VARCHAR | NOT NULL | Action performed |
| entity | VARCHAR | NOT NULL | Entity type |
| entityId | VARCHAR | NULLABLE | Entity ID |
| changes | JSONB | NULLABLE | Data changes |
| ipAddress | VARCHAR | NULLABLE | Client IP |
| userAgent | VARCHAR | NULLABLE | Client user agent |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- `userId`
- `entity`
- `createdAt`

## Data Integrity

### Foreign Keys
All foreign keys are properly indexed for performance.

### Constraints
- UNIQUE constraints on critical fields (email, tokens, IDs)
- NOT NULL constraints on required fields
- CHECK constraints for enum values
- CASCADE deletes for related records

### Soft Deletes
Tables with soft delete support:
- `users`
- `doctors`
- `patients`

## Performance Optimizations

### Indexes
All frequently queried columns are indexed:
- Foreign keys
- Unique identifiers
- Status fields
- Date/timestamp fields

### Query Optimization
- Use of `SELECT` specific columns instead of `SELECT *`
- Proper JOIN strategies
- Pagination support on all list endpoints
- Caching layer (Redis) for frequently accessed data

## Scalability Considerations

### Partitioning
Consider table partitioning for:
- `appointments` by date
- `audit_logs` by date
- `notifications` by date

### Replication
Read replicas can be used for:
- Dashboard queries
- Analytics
- Reporting

### Connection Pooling
Prisma connection pool configured for high concurrency.
