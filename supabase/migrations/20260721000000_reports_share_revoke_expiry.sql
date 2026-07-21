-- Share-link revoke + expiry for reports.
--
-- Adds two nullable, backward-compatible columns. Existing share links stay
-- live: both columns NULL means "active", i.e. the original "anyone with the
-- link" behaviour. A report's share link is unavailable once revoked_at is set,
-- or once share_expires_at has passed. Enforced in the public GET route
-- (src/app/api/reports/[id]/route.ts via isShareActive); set/cleared by the
-- owner-scoped PATCH handler in src/app/api/reports/route.ts.
--
-- SCHEMA NOTE: the live table is brand_audit.reports, not public.reports as the
-- earlier migration files (20260412000000_reports.sql,
-- 20260413000000_reports_user_id.sql) suggest. The runtime client pins the
-- schema at src/lib/supabase/server.ts (db.schema = 'brand_audit'), and the
-- live schema was confirmed as brand_audit.reports. Apply against brand_audit.
--
-- Lookups are by primary key (id) and the check runs on the single fetched row,
-- so no index on the new columns is needed.

BEGIN;

ALTER TABLE brand_audit.reports
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_expires_at timestamptz;

COMMIT;
