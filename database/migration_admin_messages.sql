-- Migration: Add admin messages table
-- Date: 2025-07-15
-- Description: Add table for administrator announcements and messages

-- Create admin_messages table
CREATE TABLE IF NOT EXISTS admin_messages (
    message_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    send_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_messages_pinned ON admin_messages(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_messages_author ON admin_messages(author_id);

-- Add some sample data for testing
INSERT INTO admin_messages (title, content, author_id, is_pinned, send_email) 
VALUES 
    ('Welcome to ThePool 2025 Season!', 
     'Welcome everyone to another exciting season of NFL picks! This year we have some great new features including real-time pick percentages, helmet logos, and enhanced mobile experience. 

Good luck to everyone and may the best predictor win!

- Your Commissioner', 
     1, 
     true, 
     false),
    ('Week 1 Reminder', 
     'Don''t forget to submit your picks for Week 1! Games start Thursday night so make sure to get your picks in before kickoff.

Remember: All picks must be submitted before the first game of each week starts.', 
     1, 
     false, 
     false);

-- Verify the table was created successfully
SELECT 'admin_messages table created successfully' as status;