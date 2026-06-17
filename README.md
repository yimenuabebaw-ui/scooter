# Scooter Rental Management System

Internal admin system for managing scooters, rentals, pricing, revenue, and customer national ID documents.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives
- Backend: Node.js, Express.js, JWT authentication
- Database: MongoDB with Mongoose
- Storage: Local file uploads for national ID images

## Structure

- `apps/web`: Admin frontend
- `apps/api`: REST API

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env files:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

3. Update the values, especially:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_API_URL`

4. Start both apps:

```bash
npm run dev
```

## Default behavior

- The API seeds a default pricing document if none exists.
- The API seeds the first admin account from environment variables if the `admins` collection is empty.
- National ID uploads are stored in `apps/api/uploads/ids`.

## Main features

- Admin-only authentication
- Protected dashboard routes
- Scooter CRUD and status management
- Rental creation, live timers, pause/resume, completion, and pricing snapshots
- Rental history with search and date filters
- Daily, monthly, and custom revenue reporting
- Excel and PDF report export
- National ID document viewing and downloading
