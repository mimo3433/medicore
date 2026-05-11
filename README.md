# MediCore - Healthcare Appointment Platform

A full-stack healthcare appointment booking platform where patients can discover doctors, book appointments, and manage their health — while doctors can manage schedules, track earnings, and handle patient bookings in real time.

## Features

### Patient Features
- **Find Doctors**: Search by name, specialty, location, or language
- **Book Appointments**: Select date and time slots with real-time availability
- **View Appointments**: Track upcoming, completed, and cancelled appointments
- **Secure Payments**: Stripe-integrated payment processing
- **Profile Management**: Update personal details and health information

### Doctor Features
- **Dashboard**: View today's appointments, patient stats, and earnings
- **Schedule Management**: Create weekly availability schedules with slot generation
- **Appointment Handling**: Confirm, cancel, or mark appointments as complete
- **Earnings Tracking**: Auto-calculated earnings based on completed appointments
- **Profile Editing**: Update specialization, fees, clinic address, and bio

### Platform Features
- **Authentication & Authorization**: JWT with refresh token rotation, RBAC for ADMIN/DOCTOR/PATIENT roles
- **Concurrency-Safe Booking**: PostgreSQL SERIALIZABLE transactions with row-level locking (`FOR UPDATE`)
- **Slot Availability**: Booked slots shown as unavailable in real time to prevent double-booking
- **Time Guards**: Appointments cannot be marked complete before their scheduled time
- **Redis Caching**: Slot availability and doctor profiles cached for performance
- **Stripe Payments**: Payment intent creation with webhook handling
- **Notification System**: Email and push notifications for booking confirmations
- **Security**: Helmet.js, CORS, rate limiting, input sanitization, bcrypt password hashing
- **Logging**: Winston structured logging with audit trails
- **API Documentation**: Swagger/OpenAPI specs

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15 (Neon-compatible)
- **ORM**: Prisma
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Payments**: Stripe
- **Email**: Nodemailer
- **Logging**: Winston
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand (auth store)
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router DOM v6

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Neon PostgreSQL)
- Redis 7+ (or Redis Cloud)

## Installation

### 1. Clone & Backend Setup

```bash
git clone https://github.com/yourusername/medicore.git
cd medicore
npm install
```

### 2. Environment Variables

**Backend** — copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doctor_appointments?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@medicore.com

# CORS
FRONTEND_URL=http://localhost:5173
```

**Frontend** — copy `.env.example` to `.env`:
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Database Setup

```bash
# From root directory
npx prisma generate
npx prisma db push   # or: npx prisma migrate dev
```

### 4. Run Development Servers

**Backend** (port 5000):
```bash
cd medicore
npm run dev
```

**Frontend** (port 5173):
```bash
cd medicore/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Docker Deployment

Using Docker Compose:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 5000

## API Documentation

Swagger documentation is available at:
```
http://localhost:5000/api/v1/docs
```

## Testing

Run backend tests:
```bash
npm test
npm run test:coverage
```

## Project Structure

```
medicore/
├── src/                          # Backend source
│   ├── modules/
│   │   ├── auth/                 # Authentication (JWT, login, register, logout)
│   │   ├── doctors/              # Doctor profiles, search, verification
│   │   ├── patients/             # Patient profiles
│   │   ├── schedules/            # Weekly schedules & slot generation
│   │   ├── appointments/         # Booking, status updates, completion
│   │   ├── payments/             # Stripe payment intents & webhooks
│   │   ├── notifications/        # Email & push notifications
│   │   ├── csv/                  # Bulk import/export
│   │   └── admin/                # Admin dashboard endpoints
│   ├── common/
│   │   ├── config/               # App configuration
│   │   ├── database/             # Prisma & Redis clients
│   │   ├── middleware/           # Auth, rate limit, error handler, security
│   │   ├── utils/                # Logger, response helpers, JWT
│   │   └── types/                # Shared TypeScript types
│   ├── index.ts                  # Express app setup & route registration
│   └── app.ts                    # Server entry point
├── prisma/
│   └── schema.prisma             # Database schema
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── pages/                # Route pages (Booking, Dashboard, Search, etc.)
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components (Button, Card, Input, etc.)
│   │   │   └── layout/           # Layout, Header, Footer
│   │   ├── lib/
│   │   │   └── axios.ts          # API client with interceptors
│   │   ├── store/
│   │   │   └── authStore.ts      # Zustand auth state
│   │   ├── App.tsx               # Router setup
│   │   └── main.tsx              # Entry point
│   ├── index.html
│   └── vite.config.ts
├── .env.example
├── docker-compose.yml
└── README.md
```

## Database Schema

Core PostgreSQL tables:
- `users` — User accounts (email, password, role)
- `doctors` — Doctor profiles (name, specialization, fee, address, rating)
- `patients` — Patient profiles (name, DOB, blood group, allergies)
- `schedules` — Weekly recurring schedules
- `appointment_slots` — Generated time slots (date, time, status)
- `appointments` — Bookings linking patient + doctor + slot
- `payments` — Stripe payment records
- `notifications` — User notification queue
- `refresh_tokens` — JWT refresh token store

## Concurrency & Race Condition Handling

- **SERIALIZABLE transactions** for all booking operations
- **Row-level locking** (`SELECT ... FOR UPDATE`) on slot rows
- **Idempotency keys** prevent duplicate bookings on retries
- **Slot status machine**: `AVAILABLE` → `RESERVED` → `BOOKED`

## Security

- Bcrypt password hashing (12 rounds)
- JWT access tokens (15 min) + refresh tokens (7 days)
- Rate limiting on auth endpoints
- Helmet.js headers, CORS, input sanitization
- Prisma ORM prevents SQL injection
- Environment variables for all secrets

## License

ISC

## Support

For support, email shadow5ty9@gmail.com or open an issue in the repository.
