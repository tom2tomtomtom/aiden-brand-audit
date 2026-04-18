-- Stripe event de-duplication. The /api/webhooks/stripe route currently
-- processes every delivery Stripe sends, and Stripe retries on any non-2xx
-- (or on network blips) up to ~3 days. Without a processed-events table
-- we risk running handleCheckoutCompleted / handleSubscriptionUpdated
-- twice for the same event, which would double-write subscription state
-- and — on future paid-metering endpoints — could re-deliver tokens.

CREATE TABLE IF NOT EXISTS stripe_processed_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep the table small: we only need to remember events long enough to
-- cover Stripe's retry window. A TTL-style cleanup can be added later;
-- primary-key lookups on TEXT are cheap so we don't need an extra index.
