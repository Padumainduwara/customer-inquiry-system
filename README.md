# Customer Inquiry Management System

A full-stack web application built for tracking customer inquiries from initial capture to resolution, featuring backend-enforced authentication, role-based ownership access control, strict status transitions, and optimistic locking for stale-data protection.

## Tech Stack
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, React Router
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Zod, JWT (`HttpOnly` cookies)
- **Database:** PostgreSQL
- **Testing:** Jest + Supertest (Backend), Vitest + React Testing Library (Frontend)

## Prerequisites
- Node.js (v18+)
- PostgreSQL (local installation or Docker)

## Local Setup

### 1. Start PostgreSQL
**Option A — Docker Compose:**
```bash
docker compose up -d
```

**Option B — Local PostgreSQL:**
Ensure PostgreSQL is running on port `5432` and update `backend/.env` with your local PostgreSQL credentials.

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` (see `backend/.env.example`):
```env
PORT=4000
DATABASE_URL="postgresql://postgres:root123@localhost:5432/inquiry_db?schema=public"
JWT_SECRET="super-secret-coffee-ninja-key-change-in-prod"
FRONTEND_URL="http://localhost:5173"
```

Run database migrations, seed the test accounts, and start the API server:
```bash
npx prisma migrate dev
npm run db:seed
npm run dev
```
The backend API will run on `http://localhost:4000`.

### 3. Frontend Setup
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will run on `http://localhost:5173`.

## Seeded Test Accounts
All seeded accounts use the password: **`password123`**

| Role | Email | Access Scope |
| :--- | :--- | :--- |
| **ADMIN (Manager)** | `admin@coffeeninja.lk` | View and manage all inquiries |
| **STAFF 1** | `staff1@coffeeninja.lk` | View and manage own inquiries only |
| **STAFF 2** | `staff2@coffeeninja.lk` | View and manage own inquiries only |

## Running Automated Tests

**Backend Integration Tests** (Auth `401`, Validation `400`, Ownership `403`, Status State Machine `400`, Stale Data `409`):
```bash
cd backend
npm test
```

**Frontend Component Tests** (Client-side Validation & Server Error Banner):
```bash
cd frontend
npm test
```