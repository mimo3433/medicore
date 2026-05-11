# MediCore Frontend

A modern, professional React frontend for the MediCore healthcare booking platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Accessible component primitives
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide Icons** - Icon library
- **Stripe** - Payment processing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:5000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components
│   └── ui/            # UI components (Button, Card, Input, etc.)
├── lib/
│   ├── axios.ts       # Axios instance with auth interceptors
│   └── utils.ts       # Utility functions
├── pages/
│   ├── auth/          # Login, Register pages
│   ├── dashboard/     # Patient, Doctor, Admin dashboards
│   └── ...            # Other pages
├── store/
│   └── authStore.ts   # Zustand auth store
├── App.tsx            # Main app with routing
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Features

- **Authentication** - Login, register with role-based access
- **Doctor Discovery** - Search and browse doctors
- **Appointment Booking** - Book appointments with time slot selection
- **Patient Dashboard** - View appointment history and status
- **Doctor Dashboard** - Manage schedule and view appointments
- **Admin Dashboard** - Analytics and user management
- **Responsive Design** - Works on desktop and mobile

## API Integration

The frontend uses Axios with interceptors for:
- Automatic JWT token attachment
- Token refresh on expiration
- Error handling

All API calls go through the configured Axios instance in `src/lib/axios.ts`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments |

## License

MIT
