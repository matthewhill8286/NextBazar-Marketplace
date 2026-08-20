# Agent notes

This app is a **React Router 7** (Vite + SSR) marketplace. Shared UI and API handlers still live under `app/` and `lib/`; the framework entry is `web/`.

- Dev/build: `npm run dev` / `npm run build` (delegates to `web/`)
- Do not introduce Next.js APIs (`next/cache`, `next/headers`, `"use cache"`, Cache Components)
- Data freshness: route loaders fetch per request; optional short HTTP `Cache-Control` only
- Observability: `@sentry/react-router` (DSN: `NEXT_PUBLIC_SENTRY_DSN`)
- Vercel: `vercel.json` sets `framework` to `react-router` (not Next.js). Keep the Git root as the project root so `lib/` and `app/` stay visible. Cron paths stay `/api/cron/expire-offers` and `/api/cron/expire-promotions`
