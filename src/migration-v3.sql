-- Migration V3: Add settings table for attachment size limits and system config
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('max_attachment_size_mb', '15');
