-- Migration: Add password reset functionality to users table
-- Date: 2025-08-31
-- Purpose: Add reset_token and reset_token_expiry columns for password reset flow

-- Add reset token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create index for reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Update any existing users to have null reset tokens
UPDATE users SET reset_token = NULL, reset_token_expiry = NULL 
WHERE reset_token IS NOT NULL OR reset_token_expiry IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('reset_token', 'reset_token_expiry');