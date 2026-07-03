# Fleet Safety & Driver Operations MVP Architecture

## Data model

The backend uses Prisma with PostgreSQL and the following core entities:

- `User`
  - `ADMIN`, `DISPATCHER`, or `DRIVER`
- `Vehicle`
- `DriverProfile`
  - current vehicle assignment
  - status: `OFFLINE`, `ON_DUTY`, `ON_TRIP`
  - last telemetry snapshot
- `Duty`
  - shift lifecycle
- `Trip`
  - operational trip lifecycle
- `LocationPing`
  - route history and realtime position source
- `SosAlert`
  - emergency alert lifecycle
- `AccessLog`
  - lightweight admin audit trail for driver views

## REST API surface

All API endpoints are under `/api`.

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Driver actions

- `POST /api/duty/start`
- `POST /api/duty/end`
- `POST /api/trip/start`
- `POST /api/trip/end`
- `POST /api/location`
- `POST /api/sos`

### Admin / dispatcher actions

- `GET /api/drivers`
- `GET /api/drivers/:id`
- `GET /api/drivers/:id/trips`
- `GET /api/trips/:id/route`
- `GET /api/sos`
- `POST /api/sos/:id/ack`
- `POST /api/sos/:id/resolve`

## Socket.IO surface

Socket authentication uses JWT in:

```js
handshake.auth.token
```

Rooms:

- `admins` for `ADMIN` and `DISPATCHER`
- `driver:<userId>` for drivers

Broadcast events:

- `driver:location`
- `driver:status`
- `sos:new`
- `sos:update`

## Data flow

1. Driver logs in via REST.
2. Driver starts duty.
3. Driver web client starts geolocation watch or simulator loop.
4. Every few seconds the driver web client posts location to the backend.
5. Backend persists `LocationPing`, updates `DriverProfile`, and emits realtime updates.
6. Admin dashboard receives socket events and refreshes UI state live.
7. SOS events are created by the driver and immediately broadcast to admins.

## Tech choices

- **Express**: simple REST layer with minimal overhead
- **Prisma**: type-safe ORM and schema-driven migrations
- **PostgreSQL**: durable relational store with indexing for route replay and history
- **Socket.IO**: authenticated realtime fanout to admin clients
- **Next.js**: admin dashboard with App Router and built-in route protection
- **Vite + React**: lightweight driver client ideal for browser-based simulator workflows

## Operational notes

- The admin dashboard and driver web client both rely on the backend being reachable at `http://localhost:4000` by default.
- The driver web client includes a visible tracking state while duty tracking is active so the design remains consent-forward.
