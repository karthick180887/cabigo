-- Lead Management Improvements Migration
-- Run this SQL in your Supabase SQL Editor to add the new columns

-- Add customer_name column to store the customer's name
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add call_count column to track number of call attempts
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;

-- Update existing rows to have a default call_count of 0
UPDATE booking_requests SET call_count = 0 WHERE call_count IS NULL;

-- Create an index for faster phone number lookups (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_booking_requests_contact_phone ON booking_requests(contact_phone);

-- Create an index for faster follow-up date queries
CREATE INDEX IF NOT EXISTS idx_booking_requests_follow_up_at ON booking_requests(follow_up_at);

-- Create an index for faster pickup date queries
CREATE INDEX IF NOT EXISTS idx_booking_requests_pickup_date ON booking_requests(pickup_date);

-- Optional: Add a constraint to make call_count always non-negative
ALTER TABLE booking_requests ADD CONSTRAINT call_count_non_negative CHECK (call_count >= 0);
