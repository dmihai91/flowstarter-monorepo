-- Add translation_key to industries and backfill based on current ids
alter table industries add column if not exists translation_key text;

-- Backfill translation_key using a consistent naming scheme
update industries
set translation_key = 'industry.' || replace(id, '-', '')
where translation_key is null;

-- Create index for sorting/filtering
create index if not exists industries_translation_key_idx on industries(translation_key);


