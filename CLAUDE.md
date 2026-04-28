@AGENTS.md

# AIDEN Brand Audit: Agent Guide

## 1. What this tool is

Brand Audit is a rapid competitive intelligence engine for creative teams. Users input 1-5 brands with websites. It returns strategic positioning, audience insights, visual/creative DNA analysis, competitor maps, and white-space opportunities.

Two modes: per-brand audit (logos, Facebook ads, colour palettes, press, social sentiment) and strategic-analysis mode (synthesised positioning, messaging themes, recommended actions). Delivers in 2-3 minutes for ~40 tokens per brand plus 20 for strategy (~$4-$8 total).

## 2. Ambition + soul

Brand Audit is the strategic X-ray. The senior planner who pulls a cultural tearsheet, draws a map of the territory, and hands it back without pretension. Its ambition is to put strategic thinking in the hands of every creative team, not just the strategists handing off a brief. Its soul is the generous expert who refuses to hoard knowledge.

## 3. What makes it different

- vs. brand-strategy consultants ($50k+): delivers in minutes for ~$4. No long sales cycle. Composable (1 brand or many). AIDEN's strategic worldview baked in.
- vs. generic market research: real ad data (Facebook Ad Library via ScrapeCreators). Real press/activations/social sentiment. Real colour DNA from logos. Real perception from organic social conversations.

## 4. Where it lives

- Domain: `brandaudit.aiden.services` (no hyphen, matches Gateway dashboard tool array)
- Repo: `tom2tomtomtom/aiden-brand-audit`
- Local: `/Users/tommyhyde/aiden-brand-audit`
- Deployed: Railway project `aiden-brand-audit`, service `aiden-brand-audit` (production env). Auto-deploys from `main`. Vercel deploy fully retired 2026-04-19.

## 5. Tech stack

- Next.js 16 (App Router, SSE streaming)
- React 19, Framer Motion, Recharts
- Tailwind CSS v4 (AIDEN brutalist design)
- Supabase (auth, reports, RLS)
- Anthropic Claude (`src/lib/aiden-api.ts`)
- ScrapeCreators (Facebook Ad Library)
- Apify (logo discovery)
- node-vibrant (colour extraction)
- jose (JWT verify)
- Sentry

Note: see `AGENTS.md`. This Next.js has breaking changes from your training data. Read `node_modules/next/dist/docs/` before assuming APIs.

## 6. Auth: Gateway integration

3-tier middleware (same pattern as Brief Sharpener):
1. **Tier 1** (`middleware.ts`): Local JWT verify via `jose`. Cookie `aiden-gw`. Issuer `aiden-gateway`.
2. **Tier 2**: POST to Gateway `/api/auth/session` with Supabase cookies. Sets fresh `aiden-gw` (30-min TTL).
3. **Tier 3**: Supabase auth fallback.

Protected: `/dashboard`, `/account`. Auth pages: `/login`, `/register`. Gateway login URL hardcoded at `/src/app/page.tsx`.

Files: `/src/lib/gateway-jwt.ts`, `/src/lib/auth.ts` (`requireAuth()`).

## 7. Token billing

Pricing is Gateway-owned. Brand Audit has no local Stripe subscriptions. The `/pricing` page directs users to `https://www.aiden.services/pricing` for token purchases.

- `per_brand` = 40 tokens each
- `strategic_analysis` = 20 tokens
- Total = `brands.length * 40 + 20`

**CRITICAL: Deduct UPFRONT before expensive API calls** (`/src/app/api/audit/route.ts` ~L54-122):
1. Pre-flight `checkTokens()`. Insufficient → 402, abort.
2. Loop: deduct per-brand, then strategic. ANY deduct failure → log partial, return 402. No retry.
3. Pre-flight rollback on failure.

Client: `/src/lib/gateway-tokens.ts` (fail-closed).

Gateway endpoint: `POST /api/tokens/deduct` with `X-Service-Key` + `X-User-Id`.

**Local checkout route removed 2026-04-24**: `/src/app/api/checkout/route.ts` deleted. No UI path now creates Brand Audit subscriptions.

**Stripe code fully removed 2026-04-27**: `/src/app/api/webhooks/stripe/route.ts` and `src/lib/stripe.ts` deleted. Confirmed zero subscribers on the Pro $49 / Agency $199 products before removal. Pricing is Gateway-owned. `STRIPE_*` env vars on Railway are no longer read by any code path and can be removed from the service config.

## 8. Critical files

- `/src/app/api/audit/route.ts` (~443 lines): main SSE pipeline. Token deduction upfront, fail-closed.
- `/src/lib/gateway-tokens.ts`: Gateway client, fail-closed on network errors.
- `/src/lib/gateway-jwt.ts`: JWT verify via jose.
- `/middleware.ts`: 3-tier auth.
- `/src/lib/aiden-api.ts`: phantom brain strategic analysis via Claude.
- `/src/lib/auth.ts`: `requireAuth()` + `getUser()`.
- `/src/lib/types.ts`: BrandConfig, BrandData, AuditResults, StrategicAnalysis.
- `/src/lib/tokens.ts`: local cost display.
- `/src/lib/usage.ts`: legacy plan limits (Gateway authoritative).
- `/src/app/api/tokens/route.ts`: GET balance for client.
- `/src/lib/scrape-creators.ts`: Facebook Ad Library wrapper.
- `/src/lib/social-scraper.ts`: TikTok + Instagram + Reddit.
- `/src/lib/sentiment-analyzer.ts`: Claude sentiment on posts.
- `/src/lib/brand-intel.ts`: Claude web search for press.
- `/src/lib/apify.ts`: logo finder.
- `/src/lib/colors.ts`: node-vibrant extraction.
- `/src/lib/url-guard.ts`: SSRF validation (required for user-supplied URLs).

## 9. Environment variables

**Required:**
- `AIDEN_API_URL` = `https://aiden-api-production.up.railway.app`
- `AIDEN_API_KEY`
- `AIDEN_SERVICE_KEY`
- `SCRAPE_CREATORS_API_KEY`
- `ANTHROPIC_API_KEY`
- `APIFY_API_KEY`
- `JWT_SECRET` (MUST match Gateway)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Optional:**
- `GATEWAY_URL` (default `https://www.aiden.services`)
- `NEXT_PUBLIC_GATEWAY_URL`
- `STRIPE_*` vars (SECRET_KEY, WEBHOOK_SECRET, PRICE_ID_PRO, PRICE_ID_AGENCY): no longer read by any code (removed 2026-04-27). Safe to drop from Railway config.
- `SENTRY_*`

## 10. Deployment

Railway. Project `aiden-brand-audit`, service `aiden-brand-audit`, production env. Auto-deploys from `main` via `railway.json`. Dockerfile uses standalone Next.js output. Healthcheck `/api/health`. Restart policy ON_FAILURE (max 5 retries).

Build: `npm run build` → `.next/standalone`. Start: `npm run start`.

Legacy `staging` env still exists in the same project with a `Redis` + `airwave-staging` service pair from the original fork. Not the live deploy. Ignore or clean up.

## 11. Known gotchas + incidents

- **Deduct-after exploit PATCHED 2026-04-18**: Was deducting AFTER streaming response, allowing failed-audit abuse. Now upfront in `audit/route.ts`. Pre-flight rollback on failure.
- **Local Stripe removed 2026-04-14**. Don't re-add.
- **Fail-closed regression risk**: `gateway-tokens.ts` has `gatewayUnavailable` flag. Audit returns 503 on unreachable Gateway. Monitor logs for `[gateway-tokens] Check threw:` / `Deduct threw:`.
- **SSRF hardening 2026-04-18**: `url-guard.ts` rejects private IPs, localhost, metadata servers.
- **Error blinding 2026-04-18**: Never echo raw error text to client. Generic message, log server-side.
- **Report save failure**: Supabase save fails → `results.id = undefined`, share CTA hidden, user told to retry.
- **Rate limit**: 3 audits per 60s per user.
- **SSE keepalive**: 15s interval. Railway 60s proxy timeout.

## 12. Testing

```bash
npm run test
npm run dev
npm run build
npm run lint
```

No E2E tests. Playwright MCP configured (`.playwright-mcp/`) but unused.

## 13. DO NOT

- Don't deduct tokens AFTER expensive API calls. Always upfront with rollback. This was the 2026-04-18 exploit.
- Don't add local Stripe code. Gateway-owned.
- Don't downgrade `gateway-tokens` to fail-open. Unreachable Gateway = deny the audit.
- Don't echo raw error text on audit stream failure. Generic only.
- Don't validate user-supplied URLs without `url-guard.ts` (SSRF risk).
- Don't persist `results.id` if report save fails (hides broken share links).

## 14. Related

- `AGENTS.md`: Next.js version note
- Vault: `~/Tom-Brain/AIDEN/AIDEN Hub.md`
- Gateway: `https://www.aiden.services`
- AIDEN API: `https://aiden-api-production.up.railway.app`
