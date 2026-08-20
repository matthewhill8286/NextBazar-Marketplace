# Agent notes

This app is a **React Router 7** (Vite + SSR) marketplace. Shared UI and API handlers still live under `app/` and `lib/`; the framework entry is `web/`.

- Dev/build: `npm run dev` / `npm run build` (delegates to `web/`)
- Do not introduce Next.js APIs (`next/cache`, `next/headers`, `"use cache"`, Cache Components)
- Data freshness: route loaders fetch per request; optional short HTTP `Cache-Control` only
- Observability: `@sentry/react-router` (DSN: `NEXT_PUBLIC_SENTRY_DSN`)
- Vercel: set the project Root Directory to `web/` so `@vercel/react-router` output is picked up; cron paths stay `/api/cron/expire-offers` and `/api/cron/expire-promotions`
