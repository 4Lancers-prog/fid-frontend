# Farmer Portal — Frontend

React + Vite + TypeScript + Tailwind CSS single-page app for the Farmer FID Card Maker &
Multi-Service Management Portal.

## Prerequisites

- **Node.js 18+** and npm.
- The **backend API** running (by default at `http://localhost:5000`). Start it from the
  separate backend package first.

## Quick start

```bash
npm install
npm run dev          # app on http://localhost:5173
```

Open **http://localhost:5173** and sign in with the backend's seeded admin:

```
Email:    admin@farmerportal.local
Password: Admin@12345
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no CORS setup is needed
locally — just make sure the backend is running.

## Pointing at a different backend

By default the app calls `/api` (proxied to `localhost:5000` in dev). To target a different
API base URL, copy `.env.example` to `.env` and set:

```
VITE_API_BASE_URL=https://your-api.example.com/api
```

If you change the dev proxy target, edit `vite.config.ts`.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build to dist/
npm run preview     # preview the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # unit + component tests (Vitest + Testing Library)
```

## Production build

```bash
npm run build       # outputs static files to dist/
```

Serve `dist/` from any static host (Nginx, Netlify, Vercel, S3/CloudFront, etc.). Ensure the
app can reach the backend API (set `VITE_API_BASE_URL` at build time, and configure the
backend's `CLIENT_ORIGINS` to include this app's URL).

## Features

Dashboard, FID Card Maker (live preview + print), Farmers (with change history), FRUITS/
K-Kisan assisted lookup, Crop/Vehicle/Trailer/Loan modules, Document Scanner, Wallet,
QR Payments (recharge + admin verification), Admin (users/roles + audit log), centralized
Application Management, and Reports & Analytics — all gated by the signed-in user's role.
