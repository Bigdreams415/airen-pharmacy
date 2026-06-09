# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Airen Pharmacy POS Inventory Management System — a full-stack pharmacy point-of-sale app with product/inventory management, sales tracking, services, and a dashboard. Frontend is deployed on Vercel; backend is deployed on Render.com and connects to a Supabase PostgreSQL database.

## Commands

### Frontend (`frontend/pos-inventory/`)
```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production build (4GB heap limit set)
npm test           # Run tests with react-scripts
```

### Backend (`backend/server/`)
```bash
npm run dev        # Dev server via nodemon (ts-node) on port 3001
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled dist/index.js
```

## Architecture

### Monorepo Structure
Two independent Node projects — no shared packages or workspace config. Run commands from within each directory.

### Frontend (`frontend/pos-inventory/src/`)
- **React 19 + TypeScript**, bootstrapped with Create React App, styled with **MUI v7** and **Tailwind CSS v3**
- **No router library** — page navigation is manual state (`currentPage: PageType`) in `App.tsx`, with `Layout` wrapping all pages. `PageType` is defined in `types/navigation.ts`.
- **Two-layer auth gate**:
  1. `Gatekeeper.tsx` — verifies a store access code against `/api/gatekeeper/verify`; result stored in `sessionStorage`. Wraps the entire app.
  2. JWT login within pages — token stored in `localStorage` via `ApiService`.
- **`services/api.ts`** — single `ApiService` class (exported as `apiService` singleton) that handles all HTTP calls. The base URL is hardcoded to the deployed Render backend (`https://abra-store-project.onrender.com/api`). All responses expect `{ success: boolean, data: T }` envelope.
- **Custom hooks** in `hooks/` encapsulate page-level data fetching (e.g. `useProducts`, `useSales`, `useLedger`, `useDashboard`).
- **Shared types** in `types/index.ts` — all domain models (`Product`, `Sale`, `Service`, etc.) and API response shapes.

### Backend (`backend/server/src/`)
- **Express + TypeScript**, runs on port 3001 (or `PORT` env var)
- **PostgreSQL** via `pg` Pool — connection configured from `DATABASE_URL` env var (Supabase). Individual `DB_HOST/PORT/NAME/USER/PASSWORD` vars used as fallback.
- **Multi-pharmacy support** via `PharmacyMiddleware` — reads `x-pharmacy-id` header or `pharmacyId` query param; falls back to first active pharmacy in DB. All API routes under `/api` go through this middleware.
- **Route structure** — all routes mounted under `/api`:
  - `/products`, `/sales`, `/sales-history`, `/dashboard`, `/services`, `/service-sales`
  - `/auth` — JWT-based login/logout/verify-token
  - `/gatekeeper` — access code verification
  - `/pharmacies`, `/pharmacy` — multi-pharmacy management
- **`DatabaseService`** is a singleton (`dbService`) wrapping a `pg.Pool` from `config/database.ts`.
- CORS is locked to `https://stop2shop-project.vercel.app` in production.

### Deployment
- Frontend: Vercel (`stop2shop-project.vercel.app`)
- Backend: Render.com (`abra-store-project.onrender.com`)
- Database: Supabase PostgreSQL

## Key Patterns

- All API responses must follow `{ success: boolean, data?: T, error?: string }` — the frontend `ApiService` throws if `success` is false.
- Numeric fields from the DB (prices, stock) come back as strings from PostgreSQL; `ApiService` explicitly converts them with `Number()` in `convertProductData` and `convertSaleData`.
- Adding a new page requires: (1) add the page name to `PageType` in `types/navigation.ts`, (2) add a `case` in `App.tsx`'s `renderPage()`, (3) add a nav entry in `Layout/Sidebar.tsx`, `Layout/DesktopHeader.tsx`, and `Layout/MobileHeader.tsx`.
