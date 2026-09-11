-- Migration v4: Add avatar to users table
ALTER TABLE users ADD COLUMN avatar TEXT;
