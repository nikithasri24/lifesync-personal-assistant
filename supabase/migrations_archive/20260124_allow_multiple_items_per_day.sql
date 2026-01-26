-- Allow Multiple Items Per Day
-- Remove the one-item-per-day constraint to allow scheduling multiple items

-- =====================================================
-- DROP OLD UNIQUE CONSTRAINT
-- =====================================================
-- Drop the unique constraint on (user_id, scheduled_date)
ALTER TABLE personal_care_schedule 
DROP CONSTRAINT IF EXISTS personal_care_schedule_user_id_scheduled_date_key;

-- =====================================================
-- ADD NEW UNIQUE CONSTRAINT
-- =====================================================
-- Prevent scheduling the SAME item twice on the same day
-- But allow DIFFERENT items on the same day
ALTER TABLE personal_care_schedule
ADD CONSTRAINT personal_care_schedule_user_date_item_unique 
UNIQUE(user_id, scheduled_date, item_id);

