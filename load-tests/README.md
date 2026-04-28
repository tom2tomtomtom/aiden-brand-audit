# Load tests: Brand Audit

k6 scripts. Do NOT run against live without express user approval. Each iteration burns Apify + Claude budget.

## Install

```bash
brew install k6
```

## Run

Auth cookie needed. Grab `aiden-gw` from a logged-in browser session, then:

```bash
AUTH_COOKIE="<jwt-value>" \
BRAND_URL="https://some-test-brand.com" \
BRAND_NAME="Test Brand" \
BASE_URL="https://brandaudit.aiden.services" \
k6 run load-tests/audit.k6.js
```

## Scenario

Lighter than Brief Sharpener because each audit triggers an Apify run (logo collection) + multiple scrape-creators calls + Claude analysis. Ramps 0 → 3 → 8 → 8 → 0 over ~4 minutes. P95 threshold 120s.

## Budget warning

At 8 concurrent VUs each running an audit, you are kicking off ~50-100 full brand audits across the run. That is:

- ~100 Apify compute units
- ~40 tokens/brand × 100 brands = 4000 tokens
- Multiple scrape-creators API calls per brand (ad library, social, sentiment)

**Only run this in staging or against a dedicated load-test AIDEN_SERVICE_KEY.** The fail-closed path that now returns 503 without a service key is intentional. Use a staging key with capped spend.

## Thresholds

- `http_req_failed < 5%`: allows some 503s since fail-closed may kick in.
- `http_req_duration p(95) < 120s`: audits are slow by design (Claude + Apify). Anything over 120s p95 means the 15s SSE keepalive is not carrying and Railway's 60s idle timeout is firing.

## What this will catch

- Connection-pool saturation on the shared Supabase `bktujlufguenjytbdndn` instance.
- Streaming SSE keepalive correctness under concurrent load.
- Token-debit race conditions if two audits fire simultaneously for the same user.
- Apify concurrency limits (usually 2-5 parallel runs on a standard plan).
