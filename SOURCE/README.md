# HEDYE — هدیه

A 24th-birthday interactive gift for Hedye, made by Matin. Persian, RTL, mobile-first, installable PWA that works offline.

## Run / build
    npm install
    npm run dev        # development
    npm run build      # -> dist/ (static, deploy anywhere)

`?scene=N` (1-10) jumps to a scene while testing; `?setup` shows the photo-setup reminder in the empty gallery.

## Adding Hedye's photographs
1. Copy the pictures into `public/photos/` (.jpg .jpeg .png .webp .avif). The folder ships empty on purpose.
2. Run `node scripts/index-photos.mjs` — rewrites `public/photos/manifest.json` with the exact file names.
3. `npm run build` and deploy. Open the deployed app once while online: the service worker caches the app shell, fonts, SVGs and every photo in the manifest, verifies them, and then shows the offline-ready message.

Fallback: if the folder is empty, the gallery scene offers a "pick photos from phone" button (stored in IndexedDB on that device only).

## Architecture
- `src/App.tsx` — central scene controller (one transition at a time, duplicate-call safe), progress ticks, sound toggle (muted by default), offline status.
- `src/scenes/Scene01..Scene10` — the ten scenes, each with its own timeline (`useTimeline` clears all timers on exit).
- `src/lib/` — `persian.ts` (verified Solar-Hijri data: Aban 1405 starts Friday, 28 Aban = Thursday), `safePosition.ts` (collision-aware escaping buttons), `confetti.ts` (canvas particle engine), `animation-controller.ts`, `offline.ts`, `photos.ts`, `sound.ts`.
- `src/css/` — main, typography, layout, birthday-scenes, calendar, gallery, responsive, accessibility + `animations/`.
- `public/` — `service-worker.js`, `manifest.webmanifest`, `svg/`, `icons/`, `photos/`.
- `scripts/` — `index-photos.mjs` (dev-time indexer), `make-icons.mjs`.
- Fonts (Vazirmatn, Noto Naskh Arabic) are bundled locally; nothing is fetched at runtime. TypeScript is compiled by Vite on `npm run build`.
