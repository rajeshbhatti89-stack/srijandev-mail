import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './index';

const app = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
  };
}>();

app.use('/api/*', cors());

// Basic authentication endpoint (supports either username or full user@srijandev.in)
app.post('/api/auth', async (c) => {
  const { email, password } = await c.req.json();
  const db = c.env.DB;
  
  if (!email || !password) {
    return c.json({ error: 'Email/username and password are required' }, 400);
  }

  // If user entered only username (e.g. "admin"), append "@srijandev.in"
  const trimmed = String(email).trim();
  const normalizedEmail = trimmed.includes('@') ? trimmed : `${trimmed}@srijandev.in`;

  const user = await db.prepare('SELECT id, is_admin FROM users WHERE LOWER(email) = LOWER(?) AND password_hash = ?')
    .bind(normalizedEmail, password)
    .first<{ id: string, is_admin: number }>();

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Return token (user id) and admin flag
  return c.json({ token: user.id, is_admin: user.is_admin === 1 });
});

// Middleware to check auth
const authMiddleware = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', token); // We are using the token as user ID for simplicity
  await next();
};

app.use('/api/inbox/*', authMiddleware);
app.use('/api/folders/*', authMiddleware);
app.use('/api/emails/*', authMiddleware);
app.use('/api/send', authMiddleware);
app.use('/api/admin/*', authMiddleware);
app.use('/api/profile', authMiddleware);
app.use('/api/settings', authMiddleware);
app.use('/api/contacts', authMiddleware);

// Helper to ensure settings table exists
async function ensureSettingsTable(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();
    await db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES ('max_attachment_size_mb', '15')
    `).run();
  } catch (e) {
    console.error('Settings table check error:', e);
  }
}

// Get Settings
app.get('/api/settings', async (c) => {
  await ensureSettingsTable(c.env.DB);
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'max_attachment_size_mb'").first<{ value: string }>();
  const limitMb = row && row.value ? parseInt(row.value, 10) : 15;
  return c.json({ max_attachment_size_mb: isNaN(limitMb) ? 15 : limitMb });
});

// Update Settings (Admin only)
app.put('/api/admin/settings', async (c) => {
  const userId = c.get('userId');
  const requester = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first<{ is_admin: number }>();
  if (!requester || requester.is_admin !== 1) {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await ensureSettingsTable(c.env.DB);
  const { max_attachment_size_mb } = await c.req.json();
  const limitMb = parseInt(String(max_attachment_size_mb), 10);
  if (isNaN(limitMb) || limitMb < 1) {
    return c.json({ error: 'Invalid attachment limit' }, 400);
  }
  await c.env.DB.prepare("INSERT INTO settings (key, value) VALUES ('max_attachment_size_mb', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(String(limitMb))
    .run();
  return c.json({ success: true, max_attachment_size_mb: limitMb });
});

// Get Contacts (Global Address List for @srijandev.in + remembered recent contacts)
app.get('/api/contacts', async (c) => {
  const userId = c.get('userId');
  try {
    // 1. All domain users
    const { results: domainUsers } = await c.env.DB.prepare(
      'SELECT id, name, email, avatar, is_admin FROM users ORDER BY email ASC'
    ).all();

    // 2. Recent distinct senders and recipients from user's emails
    const { results: recentEmails } = await c.env.DB.prepare(
      'SELECT sender, recipient FROM emails WHERE user_id = ? ORDER BY created_at DESC LIMIT 60'
    ).bind(userId).all();

    const contactsMap = new Map<string, { email: string, name: string, avatar?: string, is_domain_user: boolean, is_admin: boolean }>();

    // Add domain users
    if (domainUsers) {
      for (const u of domainUsers as any[]) {
        contactsMap.set(u.email.toLowerCase(), {
          email: u.email,
          name: u.name || u.email.split('@')[0],
          avatar: u.avatar || undefined,
          is_domain_user: true,
          is_admin: u.is_admin === 1
        });
      }
    }

    // Add recent email participants
    if (recentEmails) {
      for (const row of recentEmails as any[]) {
        const candidates = [row.sender, row.recipient];
        for (const cand of candidates) {
          if (!cand) continue;
          const parts = cand.split(',');
          for (const raw of parts) {
            const match = raw.trim().match(/^(?:"?([^"]*)"?\s)?(?:<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?)$/);
            if (match && match[2]) {
              const email = match[2].trim();
              const key = email.toLowerCase();
              if (!contactsMap.has(key)) {
                contactsMap.set(key, {
                  email,
                  name: match[1]?.trim() || email.split('@')[0],
                  is_domain_user: email.toLowerCase().endsWith('@srijandev.in'),
                  is_admin: false
                });
              }
            }
          }
        }
      }
    }

    return c.json(Array.from(contactsMap.values()));
  } catch (err: any) {
    console.error('Failed to get contacts:', err);
    return c.json({ error: 'Failed to fetch contacts', details: err.message }, 500);
  }
});

// Get Profile
app.get('/api/profile', async (c) => {
  const userId = c.get('userId');
  const user = await c.env.DB.prepare('SELECT id, name, email, avatar, is_admin, created_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'Not found' }, 404);
  return c.json(user);
});

// Update Profile
app.put('/api/profile', async (c) => {
  const userId = c.get('userId');
  const { name, password, avatar } = await c.req.json();
  
  if (password) {
    if (avatar !== undefined) {
      await c.env.DB.prepare('UPDATE users SET name = ?, password_hash = ?, avatar = ? WHERE id = ?')
        .bind(name, password, avatar, userId).run();
    } else {
      await c.env.DB.prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?')
        .bind(name, password, userId).run();
    }
  } else {
    if (avatar !== undefined) {
      await c.env.DB.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?')
        .bind(name, avatar, userId).run();
    } else {
      await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?')
        .bind(name, userId).run();
    }
  }
  
  return c.json({ success: true, name, avatar });
});

// Get folders
app.get('/api/folders', async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare('SELECT * FROM folders WHERE user_id = ?').bind(userId).all();
  return c.json(results);
});

// Get emails for a folder (with optional search)
app.get('/api/folders/:id/emails', async (c) => {
  const userId = c.get('userId');
  const folderId = c.req.param('id');
  const search = c.req.query('search');
  
  let query = 'SELECT id, sender, recipient, subject, read_status, is_starred, created_at FROM emails WHERE user_id = ? AND folder_id = ?';
  const params: any[] = [userId, folderId];
  
  if (search) {
    query += ' AND (subject LIKE ? OR sender LIKE ? OR text_body LIKE ?)';
    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch, likeSearch);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Get all starred emails
app.get('/api/emails/starred', async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare(
    'SELECT id, sender, recipient, subject, read_status, is_starred, created_at FROM emails WHERE user_id = ? AND is_starred = 1 ORDER BY created_at DESC'
  ).bind(userId).all();
  return c.json(results);
});

// Get single email with attachments
app.get('/api/emails/:id', async (c) => {
  const userId = c.get('userId');
  const emailId = c.req.param('id');

  // Mark as read
  await c.env.DB.prepare('UPDATE emails SET read_status = 1 WHERE id = ? AND user_id = ?').bind(emailId, userId).run();

  const email = await c.env.DB.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').bind(emailId, userId).first();
  if (!email) return c.json({ error: 'Not found' }, 404);

  // Fetch attachments metadata (omit large BLOB content in list view for performance)
  const { results: attachments } = await c.env.DB.prepare(
    'SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?'
  ).bind(emailId).all();

  return c.json({
    ...email,
    attachments
  });
});

// Star/Unstar email
app.put('/api/emails/:id/star', async (c) => {
  const userId = c.get('userId');
  const emailId = c.req.param('id');
  const { is_starred } = await c.req.json();

  await c.env.DB.prepare('UPDATE emails SET is_starred = ? WHERE id = ? AND user_id = ?')
    .bind(is_starred ? 1 : 0, emailId, userId)
    .run();

  return c.json({ success: true, is_starred });
});

// Move email to folder
app.put('/api/emails/:id/move', async (c) => {
  const userId = c.get('userId');
  const emailId = c.req.param('id');
  const { folder_id } = await c.req.json();

  await c.env.DB.prepare('UPDATE emails SET folder_id = ? WHERE id = ? AND user_id = ?')
    .bind(folder_id, emailId, userId)
    .run();

  return c.json({ success: true, folder_id });
});

// Bulk move emails to folder
app.put('/api/emails/bulk-move', async (c) => {
  const userId = c.get('userId');
  const { email_ids, folder_id } = await c.req.json();
  if (!Array.isArray(email_ids) || email_ids.length === 0) {
    return c.json({ error: 'Missing email_ids' }, 400);
  }

  const placeholders = email_ids.map(() => '?').join(',');
  await c.env.DB.prepare(`UPDATE emails SET folder_id = ? WHERE id IN (${placeholders}) AND user_id = ?`)
    .bind(folder_id, ...email_ids, userId)
    .run();

  return c.json({ success: true, count: email_ids.length, folder_id });
});

// Bulk star/unstar emails
app.put('/api/emails/bulk-star', async (c) => {
  const userId = c.get('userId');
  const { email_ids, is_starred } = await c.req.json();
  if (!Array.isArray(email_ids) || email_ids.length === 0) {
    return c.json({ error: 'Missing email_ids' }, 400);
  }

  const placeholders = email_ids.map(() => '?').join(',');
  await c.env.DB.prepare(`UPDATE emails SET is_starred = ? WHERE id IN (${placeholders}) AND user_id = ?`)
    .bind(is_starred ? 1 : 0, ...email_ids, userId)
    .run();

  return c.json({ success: true, count: email_ids.length, is_starred });
});

// Download attachment
app.get('/api/attachments/:id', async (c) => {
  const attachmentId = c.req.param('id');
  
  const attachment = await c.env.DB.prepare('SELECT * FROM attachments WHERE id = ?').bind(attachmentId).first<{ content: ArrayBuffer, content_type: string, filename: string }>();
  if (!attachment) return c.json({ error: 'Not found' }, 404);

  const headers = new Headers();
  headers.set('Content-Type', attachment.content_type);
  headers.set('Content-Disposition', `attachment; filename="${attachment.filename}"`);

  return new Response(attachment.content, { headers });
});

// Send an email (via Resend)
app.post('/api/send', async (c) => {
  const userId = c.get('userId');
  
  // Read body ONLY ONCE
  let reqBody: any = {};
  try {
    reqBody = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { to, cc, bcc, subject, body, attachments } = reqBody;

  // Helper to parse emails array
  const parseEmailList = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((e: any) => String(e).trim()).filter(Boolean);
    if (typeof input === 'string') {
      return input.split(/[,;]/).map(e => e.trim()).filter(Boolean);
    }
    return [];
  };

  const toList = parseEmailList(to);
  const ccList = parseEmailList(cc);
  const bccList = parseEmailList(bcc);

  if (toList.length === 0) {
    return c.json({ error: 'Recipient "to" is required' }, 400);
  }

  // Validate attachment limit
  await ensureSettingsTable(c.env.DB);
  const settingRow = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'max_attachment_size_mb'").first<{ value: string }>();
  const maxMb = settingRow && settingRow.value ? parseInt(settingRow.value, 10) : 15;
  const maxBytes = (isNaN(maxMb) ? 15 : maxMb) * 1024 * 1024;

  let totalAttachmentBytes = 0;
  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att && att.content) {
        // Base64 to approximate byte size
        const byteLength = Math.floor((att.content.length * 3) / 4);
        totalAttachmentBytes += byteLength;
      }
    }
  }

  if (totalAttachmentBytes > maxBytes) {
    const sizeInMb = (totalAttachmentBytes / (1024 * 1024)).toFixed(1);
    return c.json({
      error: `Attachment size (${sizeInMb} MB) exceeds maximum allowed limit of ${maxMb} MB`
    }, 400);
  }

  try {
    // Fetch sender user info
    const user = await c.env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(userId).first<{ email: string, name: string | null }>();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const fromEmail = user.email;
    const fromName = user.name && user.name.trim().length > 0 ? user.name.trim() : user.email.split('@')[0];
    const formattedFrom = `"${fromName}" <${fromEmail}>`;

    const payload: any = {
      from: formattedFrom,
      to: toList,
      reply_to: fromEmail,
      subject: subject || '(No Subject)',
      html: body || ''
    };

    if (ccList.length > 0) {
      payload.cc = ccList;
    }
    if (bccList.length > 0) {
      payload.bcc = bccList;
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content // Base64 string from frontend
      }));
    }

    if (c.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Resend API Error [${res.status}]:`, errorText);
        return c.json({ error: 'Failed to send email via mail server', details: errorText }, 500);
      }
    } else {
      console.log("Mocking send process success (no RESEND_API_KEY set).");
    }

    // Save to Sent folder
    const sentFolder = await c.env.DB.prepare("SELECT id FROM folders WHERE user_id = ? AND type = 'sent'").bind(userId).first<{ id: string }>();
    if (sentFolder) {
      const emailId = crypto.randomUUID();
      const allRecipients = toList.join(', ');
      await c.env.DB.prepare(
        'INSERT INTO emails (id, user_id, folder_id, sender, recipient, subject, html_body, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
      ).bind(emailId, userId, sentFolder.id, formattedFrom, allRecipients, subject || '(No Subject)', body || '').run();
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in /api/send:", err);
    return c.json({ error: 'Internal server error while sending email', details: err.message }, 500);
  }
});

// Admin endpoint: List all users
app.get('/api/admin/users', async (c) => {
  const userId = c.get('userId');
  try {
    const requester = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first<{ is_admin: number }>();
    if (!requester || requester.is_admin !== 1) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { results: users } = await c.env.DB.prepare(
      'SELECT id, name, email, avatar, is_admin, created_at FROM users ORDER BY created_at DESC'
    ).all();

    return c.json(users || []);
  } catch (err: any) {
    console.error('Failed to get admin users:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// Admin endpoint: Delete user
app.delete('/api/admin/users/:id', async (c) => {
  const userId = c.get('userId');
  const targetId = c.req.param('id');

  try {
    const requester = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first<{ is_admin: number }>();
    if (!requester || requester.is_admin !== 1) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    if (targetId === userId) {
      return c.json({ error: 'You cannot delete your own admin account' }, 400);
    }

    // Delete user and associated records
    await c.env.DB.prepare('DELETE FROM emails WHERE user_id = ?').bind(targetId).run();
    await c.env.DB.prepare('DELETE FROM folders WHERE user_id = ?').bind(targetId).run();
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete user:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// Admin endpoint: Provision a new user
app.post('/api/admin/users', async (c) => {
  const userId = c.get('userId');
  const { email, password, name } = await c.req.json();

  try {
    // Check if the requester is an admin
    const requester = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first<{ is_admin: number }>();
    if (!requester || requester.is_admin !== 1) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    const newUserId = crypto.randomUUID();
    const userName = name || email.split('@')[0];

    // In production, HASH the password. We use plain/mock hash for simplicity in this demo.
    await c.env.DB.prepare('INSERT INTO users (id, name, email, password_hash, is_admin) VALUES (?, ?, ?, ?, 0)')
      .bind(newUserId, userName, email, password)
      .run();

    // Create default folders
    await c.env.DB.prepare('INSERT INTO folders (id, user_id, name, type) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), newUserId, 'Inbox', 'inbox').run();
    await c.env.DB.prepare('INSERT INTO folders (id, user_id, name, type) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), newUserId, 'Sent', 'sent').run();
    await c.env.DB.prepare('INSERT INTO folders (id, user_id, name, type) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), newUserId, 'Drafts', 'drafts').run();
    await c.env.DB.prepare('INSERT INTO folders (id, user_id, name, type) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), newUserId, 'Trash', 'trash').run();

    return c.json({ success: true, userId: newUserId });
  } catch (err: any) {
    console.error("Failed to provision user:", err);
    return c.json({ error: 'Internal server error while provisioning user', details: err.message }, 500);
  }
});

export default app;
