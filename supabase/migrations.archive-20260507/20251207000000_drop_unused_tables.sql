-- Drop unused tables that are not being used in the application
-- This migration cleans up legacy and unused tables
-- Analytics will be handled by Google Analytics instead

-- Drop analytics tables (will use Google Analytics instead)
DROP TABLE IF EXISTS event_tracking CASCADE;
DROP TABLE IF EXISTS device_analytics CASCADE;
DROP TABLE IF EXISTS page_performance CASCADE;
DROP TABLE IF EXISTS lead_tracking CASCADE;
DROP TABLE IF EXISTS geographic_analytics CASCADE;
DROP TABLE IF EXISTS traffic_sources CASCADE;
DROP TABLE IF EXISTS project_analytics CASCADE;

-- Drop template repositories table (using local templates now)
DROP TABLE IF EXISTS template_repositories CASCADE;

-- Drop options tables (not used in current implementation)
DROP TABLE IF EXISTS audience_options CASCADE;
DROP TABLE IF EXISTS goal_options CASCADE;

-- Drop generated_sites table (feature not yet implemented)
DROP TABLE IF EXISTS generated_sites CASCADE;

-- Drop items table (legacy initial migration)
DROP TABLE IF EXISTS items CASCADE;
