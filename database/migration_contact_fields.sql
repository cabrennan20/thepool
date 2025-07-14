-- Migration: Add Contact Information Fields
-- Adds phone and address fields to users table

-- 1. Add phone field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Add address field to users table  
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(200);

-- 3. Add comments for documentation
COMMENT ON COLUMN users.phone IS 'User phone number for admin contact purposes';
COMMENT ON COLUMN users.address IS 'User address for admin contact purposes';

-- Note: These fields are for admin use only and not visible to other members
-- Phone supports formats like: (555) 123-4567, 555-123-4567, +1-555-123-4567
-- Address supports full addresses up to 200 characters