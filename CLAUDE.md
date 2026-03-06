# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AniView is an anime streaming web app with a Node.js/Express backend that scrapes anime data using Puppeteer and a React 19 frontend. The backend must handle Cloudflare challenges on scraped sites.

## Commands

### Backend (from `backend/`)
- `npm run dev` — start with `--watch` (auto-restart on changes), runs on port 3001 by default
- `npm start` — production start
- `node src/scripts/createAdmin.js` — create an admin user

### Frontend (from `frontend/`)
- `npm run dev` — Vite dev server on port 5173
- `npm run build` — production build
- `npm run preview` — preview production build

No test framework is configured. No linter is configured.

## Architecture

### Backend (`backend/src/`)

**Provider system with automatic fallback** — the core abstraction:
- `services/sourceManager.js` — orchestrates multiple providers with health tracking and cooldown. This is the main entry point used by controllers.
- `services/providers/` — individual provider implementations:
  - **Metadata providers** (for trending/genres/categories): `anilist.js`, `jikan.js`, `kitsu.js`
  - **Content providers** (for search/details/episodes/video): `animepahe.js`, `gogoanime.js`, `zoro.js`
- Provider selection for details/video is heuristic-based on animeId format (UUID = animepahe, slug = gogoanime, etc.)
- `services/scraperService.js` — legacy direct-scraper for animepahe (still exists but controllers use sourceManager)

**Browser management:**
- `services/browserManager.js` — singleton Puppeteer instance with stealth plugin, persistent user-data-dir for cookie persistence, and Cloudflare challenge auto-clearing
- Scrapers use in-page `fetch()` to inherit CF cookies rather than direct HTTP requests

**Request flow:** Routes (`routes/`) → Controllers (`controllers/`) → SourceManager → Providers

**Other backend concerns:**
- `utils/cache.js` — in-memory TTL cache
- `middleware/auth.js` — JWT auth middleware
- `models/` — Mongoose models (User, Analytics)
- MongoDB is optional; server starts without it (auth & analytics disabled)

### Frontend (`frontend/src/`)

- `App.jsx` — all routes defined here, navbar with search
- `api/animeApi.js` — all backend API calls via axios, hardcoded to `localhost:3001`
- `context/AuthContext.jsx` — auth state management
- `pages/` — route components (Home, SearchResults, AnimeDetails, VideoPlayer, Genre, Category, etc.)
- `components/` — shared UI (AnimeCard, SearchBar, EpisodeList, skeletons)
- Single CSS file: `styles/App.css`

## Key Configuration

- Backend `.env`: PORT, FRONTEND_URL, CACHE_TTL_SECONDS, RATE_LIMIT_*, PUPPETEER_HEADLESS, MONGO_URI, JWT_SECRET
- Set `PUPPETEER_HEADLESS=false` to debug Cloudflare challenges manually
- Both packages use ES modules (`"type": "module"`)
- Frontend API base URL is hardcoded in `frontend/src/api/animeApi.js`
