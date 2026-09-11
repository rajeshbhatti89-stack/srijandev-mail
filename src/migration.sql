-- Migration: Add is_starred to emails
ALTER TABLE emails ADD COLUMN is_starred BOOLEAN DEFAULT 0;

-- Migration: Add Trash folder for existing users
INSERT INTO folders (id, user_id, name, type)
SELECT lower(hex(randomblob(16))), id, 'Trash', 'trash'
FROM users
WHERE id NOT IN (SELECT user_id FROM folders WHERE type = 'trash');

