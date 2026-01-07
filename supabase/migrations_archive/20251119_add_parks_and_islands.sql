-- Add support for national parks and islands to visited_locations table
-- This extends the travel tracking to include granular location types

-- Add new location types to the check constraint
ALTER TABLE visited_locations
DROP CONSTRAINT IF EXISTS visited_locations_location_type_check;

ALTER TABLE visited_locations
ADD CONSTRAINT visited_locations_location_type_check
CHECK (location_type IN ('country', 'state', 'city', 'region', 'national_park', 'island'));

-- Add columns for national parks
ALTER TABLE visited_locations
ADD COLUMN IF NOT EXISTS national_park_id TEXT;

ALTER TABLE visited_locations
ADD COLUMN IF NOT EXISTS national_park_name TEXT;

-- Add column for islands
ALTER TABLE visited_locations
ADD COLUMN IF NOT EXISTS island_name TEXT;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_visited_locations_park
ON visited_locations(national_park_id) WHERE national_park_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visited_locations_island
ON visited_locations(island_name) WHERE island_name IS NOT NULL;

-- Update the unique constraint to include parks and islands
ALTER TABLE visited_locations
DROP CONSTRAINT IF EXISTS visited_locations_user_id_location_type_country_code_state_cod_key;

-- Add new unique constraint that handles all location types
-- For countries: user_id + country_code
-- For states: user_id + state_code
-- For cities: user_id + country_code + state_code + city_name
-- For parks: user_id + national_park_id
-- For islands: user_id + island_name (or national_park_id if stored there)
CREATE UNIQUE INDEX IF NOT EXISTS idx_visited_locations_unique_location
ON visited_locations (
  user_id,
  location_type,
  COALESCE(country_code, ''),
  COALESCE(state_code, ''),
  COALESCE(city_name, ''),
  COALESCE(national_park_id, ''),
  COALESCE(island_name, '')
);

-- Drop and recreate the travel stats view to include parks and islands
DROP VIEW IF EXISTS travel_stats;

CREATE VIEW travel_stats AS
SELECT
  user_id,
  COUNT(DISTINCT CASE WHEN location_type = 'country' AND status = 'visited' THEN country_code END) as countries_visited,
  COUNT(DISTINCT CASE WHEN location_type = 'state' AND status = 'visited' THEN state_code END) as states_visited,
  COUNT(DISTINCT CASE WHEN location_type = 'city' AND status = 'visited' THEN city_name END) as cities_visited,
  COUNT(DISTINCT CASE WHEN location_type = 'national_park' AND status = 'visited' THEN national_park_id END) as parks_visited,
  COUNT(DISTINCT CASE WHEN location_type = 'island' AND status = 'visited' THEN island_name END) as islands_visited,
  (SELECT COUNT(*) FROM trips t WHERE t.user_id = visited_locations.user_id) as total_trips,
  (SELECT COUNT(*) FROM trips t WHERE t.user_id = visited_locations.user_id AND status = 'completed') as completed_trips,
  (SELECT COUNT(*) FROM trips t WHERE t.user_id = visited_locations.user_id AND status IN ('planning', 'ongoing')) as upcoming_trips,
  (SELECT COALESCE(SUM(total_spent), 0) FROM trips t WHERE t.user_id = visited_locations.user_id AND status = 'completed') as total_spent,
  (SELECT COUNT(*) FROM travel_journal_entries j WHERE j.user_id = visited_locations.user_id) as journal_entries
FROM visited_locations
GROUP BY user_id;
