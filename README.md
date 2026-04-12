# BRAND DNA // ANALYZER

AI-powered competitive brand intelligence. Scrape real ad data, extract visual DNA, and get strategic analysis from AIDEN's phantom brain system.

## What It Does

Give it 2-5 brand names and websites. It will:

1. **Discover logos** via Apify's logo finder
2. **Scrape Facebook Ad Library** via ScrapeCreators for up to 50 ads per brand
3. **Extract color palettes** from brand assets using node-vibrant
4. **Gather brand intelligence** via Claude web search — PR, press, activations, campaigns, social presence
5. **Run AIDEN strategic analysis** — competitive positioning, white space opportunities, recommended actions
6. **Generate an interactive report** with 7 sections: overview, visual DNA, ad intelligence, analytics, brand intel, strategic analysis, competitive matrix

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **AIDEN API** (phantom brain strategic analysis)
- **Claude API** (web search for brand intelligence)
- **ScrapeCreators** (Facebook Ad Library scraping)
- **Apify** (logo discovery)
- **node-vibrant** (color palette extraction)
- **Supabase** (auth, database, RLS)
- **Stripe** (payments — Starter/Pro/Agency tiers)
- **Tailwind CSS v4** (AIDEN brutalist design system)
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
| `SCRAPE_CREATORS_API_KEY` | Yes | ScrapeCreators — Facebook Ad Library |
| `ANTHROPIC_API_KEY` | Yes | Claude API — brand intelligence web search |
| `APIFY_API_KEY` | Yes | Apify.com — logo discovery |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `AIDEN_API_URL` | `https://aiden-api-production.up.railway.app` | AIDEN API base URL |
| `STRIPE_SECRET_KEY` | — | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook verification |
| `STRIPE_PRICE_ID_STARTER` | — | Stripe price ID for Starter plan |
| `STRIPE_PRICE_ID_PRO` | — | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ID_AGENCY` | — | Stripe price ID for Agency plan |

## Architecture

```
User → Next.js App
  ├── /                        → Marketing landing page
  ├── /login                   → Sign in
  ├── /register                → Create account
  ├── /dashboard               → Audit form + past reports (protected)
  ├── /pricing                 → Plan comparison + Stripe checkout
  ├── /report                  → Interactive report (session-based)
  ├── /report/[id]             → Shared report (Supabase-backed)
  ├── /api/audit               → SSE pipeline (auth + usage gated)
  │     ├── Apify: logo discovery
  │     ├── ScrapeCreators: Facebook Ad Library scrape
  │     ├── node-vibrant: color extraction
  │     ├── Claude: brand intelligence (web search)
  │     └── AIDEN API: strategic analysis
  ├── /api/health              → Service health check
  ├── /api/reports             → List user's reports
  ├── /api/reports/[id]        → Load specific report
  ├── /api/companies           → Facebook company search
  ├── /api/checkout            → Stripe checkout session
  ├── /api/user-plan           → Current user plan + usage
  └── /api/webhooks/stripe     → Stripe event handler
```

## Report Sections

1. **Overview** — Executive summary + brand cards with logos, color swatches, stats
2. **Visual DNA** — Side-by-side color palettes, shared patterns, unique elements
3. **Ad Intelligence** — Filterable ad gallery with platform tags, CTAs, Ad Library links
4. **Analytics** — Charts for format mix, platform breakdown, CTA distribution
5. **Brand Intel** — Press releases, coverage, activations, campaigns, social presence (with citations)
6. **Strategic Analysis** — Messaging themes, tone & voice, white space opportunities, recommended actions
7. **Competitive Matrix** — Strengths/weaknesses per brand, comparison table, market positioning

## Pricing

| Plan | Price | Audits |
|------|-------|--------|
| Free | $0 | 2/month |
| Starter | $49 one-time | 10 lifetime |
| Pro | $99/month | Unlimited |
| Agency | $499/month | Unlimited + white-label |

## Design System

Uses the AIDEN brutalist design system: sharp corners, deep blacks, red/orange accents, grid backgrounds, uppercase headings, monospace data.

## Deployment

Deployed on Vercel at `brandaudit-rebuild.vercel.app`. Supabase for auth + database.
