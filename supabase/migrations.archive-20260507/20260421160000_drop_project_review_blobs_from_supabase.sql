-- Move large generation/review payloads to Convex (`supabaseReviewArtifacts`).
-- Keep `generation_completed_at` on Postgres for simple filtering.

ALTER TABLE projects DROP COLUMN IF EXISTS generated_code;
ALTER TABLE projects DROP COLUMN IF EXISTS generated_files;
ALTER TABLE projects DROP COLUMN IF EXISTS preview_html;
ALTER TABLE projects DROP COLUMN IF EXISTS quality_metrics;
