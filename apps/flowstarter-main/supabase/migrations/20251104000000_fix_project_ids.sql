-- Fix project IDs to ensure they are UUIDs, not user IDs
-- This migration handles the case where project.id might have been set to user_id by mistake

DO $$
DECLARE
  bad_project RECORD;
  new_uuid UUID;
BEGIN
  -- Find any projects where the ID doesn't look like a UUID (e.g., starts with 'user_')
  FOR bad_project IN 
    SELECT id, user_id 
    FROM projects 
    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  LOOP
    -- Generate a new UUID for this project
    new_uuid := gen_random_uuid();
    
    -- Update foreign key references first
    UPDATE deployment_configs SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE device_analytics SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE generated_sites SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE page_analytics SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE project_analytics SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE traffic_sources SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE user_feedback SET project_id = new_uuid WHERE project_id = bad_project.id;
    UPDATE user_location_analytics SET project_id = new_uuid WHERE project_id = bad_project.id;
    
    -- Update the project itself
    UPDATE projects SET id = new_uuid WHERE id = bad_project.id;
    
    RAISE NOTICE 'Fixed project ID from % to %', bad_project.id, new_uuid;
  END LOOP;
END $$;
