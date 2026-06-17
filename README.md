# Recipe Pantry PWA

Recipe Pantry is a production-minded Progressive Web App for browsing TheMealDB recipes through a secure Node/Express proxy. The client never calls TheMealDB directly; all recipe traffic goes through `/api/*`, while saved favorites are persisted locally in IndexedDB for offline use.

## Features

- Search recipes by name and browse category chips.
- View full recipe details with ingredients, instructions, tags, source links, and YouTube links.
- Listen to recipes with hands-free read-aloud controls for cooking.
- Switch ingredient measurements between metric and imperial with a saved preference.
- Favorite and unfavorite recipes, with full favorite records stored in IndexedDB.
- Favorites page works offline, including local filter, sort, view, and remove.
- Manual PWA setup: manifest, app icons, service worker, app-shell precache, runtime caching, and offline fallback page.
- Accessible UI with semantic landmarks, labels, skip link, keyboard-friendly controls, skeleton states, toasts, and an error boundary.

## Tech Stack

- Client: React, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components, TanStack Query, React Router, Sonner, IndexedDB via `idb`.
- Server: Node.js, Express, TypeScript, CORS, Helmet, Compression, dotenv.
- Data: TheMealDB v1, proxied through the server.

## Project Tree

```text
.
├── README.md
├── package.json
├── server
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src
│       ├── index.ts
│       └── routes
│           └── mealdb.ts
└── client
    ├── components.json
    ├── index.html
    ├── package.json
    ├── postcss.config.cjs
    ├── tailwind.config.cjs
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── public
    │   ├── manifest.webmanifest
    │   ├── offline.html
    │   └── icons
    │       ├── icon.svg
    │       ├── icon-192.svg
    │       ├── icon-512.svg
    │       └── maskable.svg
    └── src
        ├── App.tsx
        ├── main.tsx
        ├── sw.js
        ├── vite-env.d.ts
        ├── components
        ├── features
        ├── lib
        ├── pages
        └── styles
```

## Setup

Run the server:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Run the client in another terminal:

```bash
cd client
npm install
npm run dev
```

Or run both from the repo root:

```bash
npm install
npm run install:all
npm run dev
```

The client runs on `http://localhost:5173`, and Vite proxies `/api/*` to the server on `http://localhost:5174`.

## Environment Variables

Server variables live in `server/.env`.

```bash
MEALDB_API_BASE=https://www.themealdb.com/api/json/v1
MEALDB_API_KEY=1
PORT=5174
CLIENT_ORIGIN=http://localhost:5173
```

`MEALDB_API_KEY` defaults to `1` for local development if omitted. Do not put this key in the client.

## shadcn/ui Notes

This repo includes local shadcn-style components under `client/src/components/ui` plus a `components.json` configuration. To regenerate or add more components later:

```bash
cd client
npx shadcn@latest init
npx shadcn@latest add button card input badge dialog skeleton sonner
```

Keep the existing Tailwind CSS variables in `client/src/styles/globals.css` unless you intentionally redesign the theme.

## PWA Details

The app registers `/sw.js`, generated from `client/src/sw.js`.

- App shell precache: `/`, `offline.html`, manifest, placeholder icons, and Vite build JS/CSS assets.
- Static assets: stale-while-revalidate for same-origin scripts, styles, fonts, icons, manifest, and built assets.
- Images: stale-while-revalidate in the image cache.
- Categories: stale-while-revalidate for `/api/categories`.
- Search, details, category filters, and random: network-first with cache fallback for `/api/*`.
- Recipe links: visible recipe cards prefetch their detail responses in the background, so more detail pages work offline after browsing online.
- Navigations: network-first, then cached shell, then `/offline.html`.

To test offline behavior:

1. Run the app, open it in the browser, and load a few recipes.
2. Save one or more favorites.
3. In DevTools, enable offline mode.
4. Reload the app and open `/favorites`.
5. Confirm saved recipes can be viewed and removed.

## Build And Deploy

```bash
npm run build
```

### Vercel (client + API together)

This repo includes a root `vercel.json` that:

- Builds the Vite client into `client/dist`
- Builds the Express proxy and exposes it as a Vercel serverless function at `/api/*`
- Rewrites SPA routes to `index.html` for React Router

Deploy steps:

1. Push the repo to GitHub and import it in Vercel.
2. Leave the root directory as `.` (Vercel reads `vercel.json` automatically).
3. Add environment variables in the Vercel dashboard:
   - `MEALDB_API_KEY` (use `1` for development)
   - `MEALDB_API_BASE` = `https://www.themealdb.com/api/json/v1`
   - Optional: `CLIENT_ORIGIN` = your production URL (defaults to the Vercel URL)
4. Deploy.

Local development still uses two processes via one command:

```bash
npm install
npm run dev
```

### Other hosts

Deploy the server to a Node host such as Render, Fly.io, or Railway. Set the server environment variables in the host dashboard. Deploy the client to Netlify or another static host and configure `/api/*` rewrites to the server URL.

## Changing Cache Strategies

Service-worker strategies are centralized in `client/src/sw.js`.

- Change `VERSION` to invalidate all existing caches.
- Add stable public assets to `APP_SHELL`.
- Adjust `/api/*` route branches in the fetch handler if a new endpoint should be network-first or stale-while-revalidate.
- Keep favorites in IndexedDB for offline correctness; the service worker cache is only a read-through cache for fetched recipe data.

## Post-Generation Checklist

- Replace SVG placeholder icons with production PNG/maskable icons if your app store or browser target requires PNG.
- Review deploy rewrites so the client still calls only `/api/*`.
- Generate additional shadcn components as the UI grows.
- Run Lighthouse PWA checks after production deployment.
