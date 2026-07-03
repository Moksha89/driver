# Fleet Safety & Driver Operations MVP

This repository is a monorepo for the first-phase MVP of the Fleet Safety & Driver Operations platform.

## Packages

- `backend/` - Node.js + TypeScript Express API, Prisma, Socket.IO
- `admin/` - Next.js admin dashboard
- `driver-web/` - browser-based driver client / simulator

## Architecture at a glance

- Drivers authenticate against the backend and post duty, trip, location, and SOS events over REST.
- The backend persists data in PostgreSQL via Prisma and broadcasts realtime updates with Socket.IO.
- The admin dashboard consumes REST seed data and realtime updates to monitor fleet status.
- The driver web app is a lightweight browser client for live testing and simulator-driven E2E flows.

## Local setup

### 1) Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432` with:

- user: `postgres`
- password: `postgres`
- database: `fleet_safety`

### 2) Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:4000`.

Seed credentials:

- Admin: `0500000000` / `admin123`
- Driver 1: `0500000001` / `driver123`
- Driver 2: `0500000002` / `driver123`

### 3) Admin dashboard

```bash
cd admin
npm install
npm run dev
```

Admin runs on `http://localhost:3000`.

### 4) Driver web client / simulator

```bash
cd driver-web
npm install
npm run dev
```

Driver web runs on `http://localhost:5173`.

## Ports

- PostgreSQL: `5432`
- Backend API / Socket.IO: `4000`
- Admin dashboard: `3000`
- Driver web: `5173`

## Scope / roadmap

Phase 1 is delivered here:

- Authentication
- Driver duty and trip flow
- Live location ingestion
- SOS alerts
- Admin monitoring dashboard
- Browser-based driver web client for E2E testing

Future phases:

1. Geofencing and automated alerts
2. Live audio/video via WebRTC
3. Hardware / dashcam integration

## Tracking visibility / consent

The current driver web client intentionally surfaces a visible tracking indicator while duty tracking is active. Tracking is designed to be transparent and user-visible, and no private-time tracking should occur outside an active duty flow.
