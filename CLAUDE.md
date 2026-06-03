# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ứng dụng Quản lý Thu Chi** — a Vietnamese-language personal expense tracker. Full-stack monorepo: React + Vite (frontend) and Express.js + MySQL (backend). Users log income (thu) and expenses (chi), view analytics, and admins manage the user base.

## Development Commands

### Backend
```bash
cd backend && npm install      # Install dependencies
cd backend && npm run dev      # Start with --watch (auto-reload) on port 3001
cd backend && node server.js   # Start without auto-reload
```

### Frontend
```bash
cd frontend && npm install     # Install dependencies
cd frontend && npm run dev     # Vite dev server on port 5173, proxies /api → :3001
cd frontend && npm run lint    # ESLint check
cd frontend && npm run build   # Production build to frontend/dist/
```

### Production (Railway)
```bash
npm run build   # Builds frontend/dist/ (from root)
npm start       # Runs Express which serves the SPA + API on $PORT
```

No test suite is configured.

## Environment Variables

Create `backend/.env` (not committed):
```
PORT=3001
JWT_SECRET=your-jwt-secret
SETUP_SECRET=your-setup-secret
MYSQLHOST=localhost
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=
MYSQLDATABASE=thuchi
```

The `SETUP_SECRET` protects the `GET /api/reset-all` and `GET /api/setup-admin` maintenance endpoints.

## Architecture

### Monorepo layout
```
backend/          Express API (port 3001)
  server.js       Entry point — DB init, mounts routes, serves SPA in production
  db.js           MySQL connection pool + CREATE TABLE IF NOT EXISTS on startup
  middleware/     auth.js (JWT verify), admin.js (is_admin gate)
  routes/         auth.js, transactions.js, admin.js
  utils/          categorize.js — keyword-based auto-categorizer
frontend/         React SPA (port 5173 in dev)
  src/
    App.jsx       Auth gate: no token → AuthPage, token → Layout
    api.js        Axios instance — reads token from localStorage, attaches Bearer header
    pages/        AuthPage, HomePage, ReportPage, AdminPage
    components/   Layout.jsx — tab navigation
```

### Request flow
1. Frontend calls `/api/*` — in dev, Vite proxies to `localhost:3001`; in production, Express serves `frontend/dist` and handles `/api/*` on the same process.
2. JWT is stored in `localStorage` as `token`. `api.js` attaches it automatically via an Axios request interceptor.
3. `middleware/auth.js` verifies the JWT; `middleware/admin.js` additionally checks `req.user.is_admin`.

### Database
Two tables auto-created by `backend/db.js` on first run:
- `users` — `id, phone (unique), password (bcrypt), name, is_admin, created_at`
- `transactions` — `id, user_id (FK), type ENUM('thu','chi'), amount, description, category, created_at`

Timezone is set to `+07:00` (Vietnam) at the pool level.

### Auto-categorization
`backend/utils/categorize.js` assigns a category to `chi` transactions by matching Vietnamese keywords in the description:
- `phat-trien` — learning/self-improvement (sách, khóa học, gym, …)
- `sinh-hoat` — daily living (xăng, điện, nước, chợ, …)
- `tieu-dung` — default fallback

`thu` transactions always get category `thu-nhap`.

### Admin system
- `is_admin` is a `TINYINT(1)` column on `users`.
- Use `GET /api/setup-admin?secret=SETUP_SECRET&phone=…&password=…` to bootstrap the first admin account.
- Admin routes: system stats, paginated user list, toggle admin flag, delete user (cascades transactions).

## Key Conventions

- **Language**: UI strings and variable names are a mix of Vietnamese and English. Route paths and DB column names use English; user-facing labels, error messages, and category slugs use Vietnamese or Vietnamese-style slugs (`phat-trien`, `sinh-hoat`).
- **Auth**: JWT expiry is 30 days. On 401 from the API, `api.js` clears `localStorage` and redirects to `/` for re-login.
- **Styling**: Tailwind CSS utility classes only — no separate CSS modules or styled-components.
- **State**: No global state library. Each page manages its own state with `useState`/`useEffect`. Auth state lives in `localStorage`.
- **Charts**: Recharts — `PieChart` for thu/chi ratio, `BarChart` for daily totals by period.
- **No TypeScript**: The entire codebase is plain JavaScript/JSX.
