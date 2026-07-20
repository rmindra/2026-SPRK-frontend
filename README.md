# 2026-SPRK Frontend

Aplikasi frontend untuk **Sistem Peminjaman Ruangan Kampus (SPRK)**, dibangun dengan **React + TypeScript + Vite**.

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Framework   | React 19 + TypeScript                               |
| Build Tool  | Vite 7                                              |
| Routing     | React Router DOM v7                                 |
| HTTP Client | Native `fetch` (wrapper in `src/api/client.ts`)     |
| Linting     | ESLint + typescript-eslint                          |
| Formatting  | Prettier                                            |
| Containerization | Docker + Nginx (production/Docker mode)        |

---

## Project Structure

```
src/
├── api/              ← HTTP client & per-resource API functions
│   ├── client.ts     ← Base fetch wrapper (ApiError, get, post, put, patch, del)
│   ├── rooms.ts      ← Rooms CRUD API calls
│   └── bookings.ts   ← Bookings CRUD + filter API calls
├── components/       ← Shared UI components
│   ├── Layout.tsx    ← App shell (header + nav + <Outlet />)
│   └── AppErrorBoundary.tsx
├── pages/            ← Route-level page components
│   ├── RoomsPage, RoomDetailPage, RoomsNewPage, RoomEditPage
│   └── BookingsPage, BookingDetailPage, BookingNewPage, BookingEditPage
├── types/
│   └── index.ts      ← TypeScript types mirroring backend DTOs
└── utils/
```

---

## Running Locally (without Docker)

### Prerequisites
- Node.js ≥ 20
- Backend running at `http://localhost:5006` (see `2026-SPRK-backend`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file (already exists — skip if .env is present)
cp .env.example .env

# 3. Start dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

> **Proxy**: `vite.config.ts` proxies all `/api/*` requests to `VITE_API_BASE_URL` (default: `http://localhost:5006`).
> This means CORS is handled automatically — you don't need to configure anything extra.

---

## Running via Docker (recommended)

Use the infrastructure repo to launch everything together:

```bash
# From 2026-SPRK-infrastructure/
make dev
```

See [`2026-SPRK-infrastructure/README.md`](../2026-SPRK-infrastructure/README.md) for full instructions.

---

## Environment Variables

| Variable            | Default                  | Description                                     |
|---------------------|--------------------------|-------------------------------------------------|
| `VITE_API_BASE_URL` | `http://localhost:5006`  | Backend API base URL used by the Vite proxy     |

> In **Docker/production**, `VITE_API_BASE_URL` is baked into the Nginx image at build time via `docker-compose ARG`.

---

## Available Scripts

| Command              | Description                        |
|----------------------|------------------------------------|
| `npm run dev`        | Start Vite dev server (port 5173)  |
| `npm run build`      | TypeScript check + production build |
| `npm run preview`    | Preview production build locally   |
| `npm run lint`       | Run ESLint                         |
| `npm run format`     | Format code with Prettier          |
| `npm run format:check` | Check formatting without writing |

---

## API Integration

All API calls go through `src/api/client.ts`:
- Errors from the backend (4xx/5xx) are thrown as typed `ApiError` instances.
- The base URL is read from `VITE_API_BASE_URL` at build time (Vite bakes it in).
- During local dev, the Vite proxy forwards `/api/*` to the backend, so the browser always calls `localhost:5173/api/...`.

---

## License

UNLICENSED (internal project).
