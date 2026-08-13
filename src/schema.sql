DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'custom', -- 'inbox', 'sent', 'drafts', 'archive', 'trash', 'custom'
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  text_body TEXT,
  html_body TEXT,
  read_status BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  content BLOB NOT NULL,
  FOREIGN KEY(email_id) REFERENCES emails(id) ON DELETE CASCADE
);

-- Insert initial admin user
-- NOTE: In production, password should be hashed. Here we use a placeholder that the Hono API will accept for simplicity if needed, but we'll use a token for now.
INSERT INTO users (id, email, password_hash) VALUES ('admin-1', 'admin@srijandev.in', 'hashed-password');

-- Initial folders for the admin user
INSERT INTO folders (id, user_id, name, type) VALUES ('inbox-1', 'admin-1', 'Inbox', 'inbox');
INSERT INTO folders (id, user_id, name, type) VALUES ('sent-1', 'admin-1', 'Sent', 'sent');
INSERT INTO folders (id, user_id, name, type) VALUES ('drafts-1', 'admin-1', 'Drafts', 'drafts');
