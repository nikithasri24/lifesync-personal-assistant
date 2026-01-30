-- Migration: Drop Trip Planner Tables
-- This removes all trip planner functionality from the database
-- Tables to drop: trips, trip_days, travel_documents, packing_lists

-- ==================== Drop Tables ====================

-- Drop packing_lists table (if exists)
DROP TABLE IF EXISTS packing_lists CASCADE;

-- Drop travel_documents table (if exists)
DROP TABLE IF EXISTS travel_documents CASCADE;

-- Drop trip_days table (if exists)
DROP TABLE IF EXISTS trip_days CASCADE;

-- Drop trips table (if exists)
DROP TABLE IF EXISTS trips CASCADE;

-- ==================== Drop Related Functions/Triggers ====================

-- Drop any triggers related to trip tables
DROP TRIGGER IF EXISTS trigger_trips_updated_at ON trips;
DROP TRIGGER IF EXISTS trigger_trip_days_updated_at ON trip_days;
DROP TRIGGER IF EXISTS trigger_travel_documents_updated_at ON travel_documents;
DROP TRIGGER IF EXISTS trigger_packing_lists_updated_at ON packing_lists;

-- Drop any functions related to trip tables
DROP FUNCTION IF EXISTS update_trips_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_trip_days_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_travel_documents_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_packing_lists_updated_at() CASCADE;

-- ==================== Notes ====================
-- This migration removes all trip planner functionality
-- The travel tracking feature (visited_locations) remains intact
-- Visa calculator functionality remains intact

