-- Rename projects.chat column to projects.data for better semantic meaning
-- The column stores project configuration data, not chat messages

ALTER TABLE projects 
RENAME COLUMN chat TO data;

-- Add comment to document the column purpose
COMMENT ON COLUMN projects.data IS 'JSON-serialized project configuration and metadata';
