# MediCore - Healthcare Booking Backend Platform

A highly scalable, secure, production-ready backend platform for a healthcare appointment ecosystem where patients can seamlessly discover doctors, book appointments, make secure payments, receive notifications, and manage healthcare interactions in real time.

## Features

- **Authentication & Authorization**: JWT with refresh token rotation, RBAC for ADMIN/DOCTOR/PATIENT roles
- **Doctor Management**: Profile management, availability scheduling, verification system
- **Appointment Booking**: Concurrency-safe booking with PostgreSQL transactions and row-level locking
- **Payment Integration**: Stripe integration with webhook verification
- **Notification System**: Email, push notifications, and in-app notifications
- **CSV Import/Export**: Bulk data operations for doctors, patients, and appointments
- **Admin Dashboard**: Analytics, user management, refund processing
- **Redis Caching**: Performance optimization with distributed caching
- **Queue System**: BullMQ for background job processing
- **Security**: Helmet.js, CORS, rate limiting, input sanitization
- **Logging**: Winston/Pino with audit logging
- **API Documentation**: Swagger/OpenAPI specs

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Payments**: Stripe
- **Email**: Nodemailer/SendGrid
- **Push Notifications**: Firebase
- **File Storage**: AWS S3/Cloudinary
- **API Docs**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medicore.git
cd medicore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medicore?schema=public"
JWT_SECRET=your-super-secret-jwt-key
REDIS_HOST=localhost
REDIS_PORT=6379
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Generate Prisma client:
```bash
npx prisma generate
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Docker Deployment

Using Docker Compose:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 3000

## API Documentation

Swagger documentation is available at:
```
http://localhost:3000/api/v1/docs
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
medicore/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication module
│   │   ├── doctors/        # Doctor management
│   │   ├── patients/       # Patient management
│   │   ├── schedules/      # Schedule & availability
│   │   ├── appointments/   # Appointment booking
│   │   ├── payments/       # Payment processing
│   │   ├── notifications/  # Notification system
│   │   ├── csv/            # CSV import/export
│   │   └── admin/          # Admin dashboard
│   ├── common/
│   │   ├── config/         # Configuration
│   │   ├── database/       # Database connections
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   ├── events/         # Event emitters
│   │   └── jobs/           # Background jobs
│   ├── index.ts            # Express app setup
│   └── app.ts              # Application entry point
├── prisma/
│   └── schema.prisma       # Database schema
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── setup.ts            # Test setup
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Docker image
└── README.md
```

## Database Schema

The platform uses PostgreSQL with the following core tables:
- `users` - User accounts
- `doctors` - Doctor profiles
- `patients` - Patient profiles
- `schedules` - Weekly schedules
- `appointment_slots` - Time slots
- `appointments` - Bookings
- `payments` - Payment records
- `notifications` - User notifications
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - System audit logs

## Concurrency Handling

The booking system uses enterprise-grade concurrency protection:
- PostgreSQL SERIALIZABLE transactions
- Row-level locking using `FOR UPDATE`
- Idempotency keys for booking/payment requests
- Redis distributed locks (optional)

## Security Best Practices

- Password hashing with bcrypt
- HTTP-only refresh token cookies
- Rate limiting on all endpoints
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet.js)
- CSRF protection strategy
- CORS configuration
- Environment variable management

## Scalability Strategy

- Stateless API architecture
- Horizontal scaling support
- Redis distributed caching
- Queue-based background processing
- Database connection pooling
- Optimized database queries with indexing

## Monitoring & Logging

- Winston/Pino structured logging
- Request/response logging
- Error tracking
- Audit logging for sensitive operations
- Health check endpoint: `/health`

## CI/CD Pipeline

The project uses GitHub Actions for:
- Automated testing on push/PR
- Docker image building
- Deployment to production
- Code quality checks

## License

ISC

## Support

For support, email support@medicore.com or open an issue in the repository.
