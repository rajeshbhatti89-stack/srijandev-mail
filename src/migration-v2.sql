-- Migration V2: Add name to users
ALTER TABLE users ADD COLUMN name TEXT;
