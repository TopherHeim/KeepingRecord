# KeepingRecord 

A web app for cataloging and tracking a vinyl record collection — with barcode scanning, automatic cover art and metadata lookup, AI-powered recommendations, and a native iOS app.

**Live site:** [https://KeepingRecord.netlify.app/](https://vinyltracker.netlify.app/)

## Features

- **Collection & wishlist** — add records by hand or by scanning the barcode with your phone camera
- **Barcode scanning** — native `BarcodeDetector` API with a Quagga fallback; looks up releases on Discogs by UPC/EAN
- **Automatic metadata** — cover art, artist/title canonicalization, genre, and year filled in from Discogs and iTunes
- **Spine colors** — each record's dominant spine color is extracted from its cover art and used throughout the UI
- **AI recommendations** — Gemini suggests new records based on what you already own
- **Stats** — charts breaking down your collection by genre, decade, and more
- **Showcase mode** — an animated turntable display that kicks in when the app sits idle
- **Explore** — browse other users' collections
- **Shake to play** — shake your phone to get a random record from your collection
- **PWA + iOS app** — installable as a progressive web app, or built as a native iOS app via Capacitor

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind (utility classes) |
| Backend | Netlify Functions (serverless) |
| Database & auth | Supabase (Postgres) |
| External APIs | Discogs, iTunes Search, Google Gemini |
| Mobile | Capacitor (iOS) |

## Project structure

```
├── App.tsx                  # Main app component & state
├── components/              # UI components (TileView, BarcodeScanner, modals, …)
├── services/                # Client-side services (Discogs, Gemini, spine color, API base)
├── Hooks/                   # Custom React hooks
├── netlify/functions/       # Serverless functions
│   ├── discogs-proxy.js     #   Discogs search (keeps the API token server-side)
│   ├── image-proxy.ts       #   CORS-safe image proxy for color extraction
│   ├── gemini.mts           #   AI metadata & recommendations
│   └── keep-alive.mts       #   Scheduled daily ping so Supabase stays active
├── ios/                     # Capacitor iOS project
└── public/                  # Static assets & PWA manifest
```

## Local development

**Prerequisites:** Node 18+, the [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm i -g netlify-cli`), and accounts/keys for Supabase, Discogs, and Gemini.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```bash
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_DEFAULT_USER_ID=<uuid of the collection shown to logged-out visitors>
   ```

3. Run the dev server **through Netlify** so the serverless functions work:

   ```bash
   netlify dev
   ```

   This serves the app at `http://localhost:8888` (Vite runs underneath on port 3000). Running plain `npm run dev` will start the UI, but Discogs lookups, barcode scanning, and AI features will fail because the functions aren't running.

## Deploying to Netlify

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, and pick the repo. Build settings are read automatically from `netlify.toml` (build command `npm run build`, publish directory `dist`, functions in `netlify/functions`).
3. Under **Site configuration → Environment variables**, add:

   | Variable | Used by | Purpose |
   |---|---|---|
   | `VITE_SUPABASE_URL` | frontend + keep-alive | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | frontend + keep-alive | Supabase anon (public) key |
   | `VITE_DEFAULT_USER_ID` | frontend | Collection shown to logged-out visitors |
   | `DISCOGS_TOKEN` | discogs-proxy | Discogs personal access token |
   | `GEMINI_API_KEY` | gemini | Google Gemini API key |

4. Deploy. The `keep-alive` scheduled function starts running daily once the site is published — check **Logs → Functions** to confirm.

## Supabase setup

The app expects three tables: `albums`, `vault_users`, and `keep_alive`.

```sql
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  genre text,
  year text,
  spine_color text,
  status text default 'collection',   -- 'collection' | 'wishlist'
  added_at timestamptz default now(),
  user_id uuid references public.vault_users(id),
  cover_url text
);

create table public.vault_users (
  id uuid primary key,                -- matches the Supabase Auth user id
  username text unique not null,
  avatar_icon text,
  created_at timestamptz default now(),
  is_public boolean not null default true,        -- share-link gate
  pref_showcase boolean not null default true,    -- settings toggles
  pref_shake boolean not null default false,
  pref_opening_tab text not null default 'TILES'
);

create table public.keep_alive (
  id integer primary key default 1,
  last_ping timestamptz default now()
);
```

`keep_alive` needs RLS policies allowing the `anon` role to select/insert/update the single `id = 1` row, since the scheduled function writes with the anon key.

## iOS app (Capacitor)

```bash
npm run build
npx cap sync ios
npx cap open ios   # opens Xcode — build & run from there
```

The native app calls the deployed Netlify functions directly (see `services/apiBase.ts`). If you fork this project, point `API_BASE` at your own Netlify site URL or set `VITE_API_BASE` when building.

## Future ideas

- "Do I own this?" scan mode for crate digging at record stores
- Cover-photo identification (for pre-barcode pressings) via Gemini vision
- Collection value tracking from Discogs marketplace data
- Pressing details & condition grading
- Shelf view rendering records as colored spines
- Play history and listening stats
