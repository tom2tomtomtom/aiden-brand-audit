# BRAND DNA // ANALYZER

AI-powered competitive brand intelligence. Scrape real ad data, extract visual DNA, and get strategic analysis from AIDEN's phantom brain system.

## What It Does

Give it 2-5 brand names and websites. It will:

1. **Discover logos** via Apify's logo finder
2. **Scrape Facebook Ad Library** for up to 50 ads per brand
3. **Extract color palettes** from brand assets using node-vibrant
4. **Run AIDEN strategic analysis** — competitive positioning, white space opportunities, recommended actions
5. **Generate an interactive report** with brand cards, visual DNA comparison, ad gallery, and competitive matrix

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **AIDEN API** (phantom brain strategic analysis)
- **Apify** (Facebook Ad Library + logo scraping)
- **node-vibrant** (color palette extraction)
- **Tailwind CSS** (AIDEN brutalist design system)
- **Server-Sent Events** (real-time progress streaming)

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your API keys
npm run dev
```

### Required Environment Variables

| Variable | Required | Source |
|----------|----------|--------|
| `AIDEN_API_KEY` | Yes | AIDEN API key for strategic analysis |
| `APIFY_API_KEY` | Yes | Apify.com — for ad/logo scraping (~$0.45/brand) |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `AIDEN_API_URL` | `https://aiden-api-production.up.railway.app` | AIDEN API base URL |

## Architecture

```
User → Next.js App
  ├── /                        → Brand input form + progress
  ├── /report                  → Interactive report (5 sections)
  ├── /api/audit               → SSE pipeline (collect → analyze → report)
  │     ├── Apify: logo discovery
  │     ├── Apify: Facebook Ad Library scrape
  │     ├── node-vibrant: color extraction
  │     └── AIDEN API: strategic analysis
  └── /api/health              → Service health check
```

## Report Sections

1. **Overview** — Executive summary + brand cards with logos, color swatches, stats
2. **Visual DNA** — Side-by-side color palettes, shared patterns, unique elements, screenshot galleries
3. **Ad Intelligence** — Filterable ad gallery with platform tags, CTAs, Ad Library links
4. **Strategic Analysis** — Messaging themes, tone & voice, white space opportunities, recommended actions
5. **Competitive Matrix** — Strengths/weaknesses per brand, comparison table, market positioning

## Design System

Uses the AIDEN brutalist design system: sharp corners, deep blacks, red/orange accents, grid backgrounds, uppercase headings, monospace data.
