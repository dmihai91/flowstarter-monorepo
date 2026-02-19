# Supabase Migrations

This directory contains database migrations for the Supabase project.

## Running Migrations

### Option 1: Using the Supabase CLI (Recommended)

If you have the Supabase CLI installed, you can run the migrations using:

```bash
supabase db push
```

This will apply any pending migrations to your Supabase project.

### Option 2: Using the SQL Editor in Supabase Dashboard

If you don't have the CLI set up, you can run migrations manually:

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of the migration file (e.g., `20230501000000_clerk_user_id.sql`)
5. Paste into the SQL Editor and run the query

## Migration: Convert user_id to TEXT for Clerk IDs

Migration file: `20230501000000_clerk_user_id.sql`

This migration:

- Removes any foreign key constraints on the user_id column
- Changes the user_id column type from UUID to TEXT
- Adds an index on user_id for better performance

This allows storing Clerk user IDs (format: `user_2wjQg6mkpuZ4qvsdVrvOAP09M2o`) directly in the database without conversion.

## Reverting Migrations

If you need to revert the changes:

1. Run the reversion migration file: `20230501000001_revert_clerk_user_id.sql`
2. Note that this may fail if you have data that cannot be converted back to UUID format

## Checking Migration Status

To check if the migration was successfully applied, you can verify the column type:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'user_id';
```

The result should show `data_type` as `text` after the migration is applied.
