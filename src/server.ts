import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './index';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());

// Basic authentication endpoint
app.post('/api/auth', async (c) => {
  const { email, password } = await c.req.json();
  const db = c.env.DB;
  
  // Basic check for admin user
  const user = await db.prepare('SELECT id FROM users WHERE email = ? AND password_hash = ?')
    .bind(email, password)
    .first<{ id: string }>();

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // In a real app, generate a JWT. For this example, we return a simple token (the user id).
  return c.json({ token: user.id });
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

// Get folders
app.get('/api/folders', async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare('SELECT * FROM folders WHERE user_id = ?').bind(userId).all();
  return c.json(results);
});

// Get emails for a folder
app.get('/api/folders/:id/emails', async (c) => {
  const userId = c.get('userId');
  const folderId = c.req.param('id');
  
  const { results } = await c.env.DB.prepare(
    'SELECT id, sender, recipient, subject, read_status, created_at FROM emails WHERE user_id = ? AND folder_id = ? ORDER BY created_at DESC'
  ).bind(userId, folderId).all();
  
  return c.json(results);
});

// Get a specific email
app.get('/api/emails/:id', async (c) => {
  const userId = c.get('userId');
  const emailId = c.req.param('id');
  
  const email = await c.env.DB.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').bind(emailId, userId).first();
  if (!email) return c.json({ error: 'Not found' }, 404);

  // Get attachments if any
  const { results: attachments } = await c.env.DB.prepare('SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?').bind(emailId).all();

  // Mark as read
  await c.env.DB.prepare('UPDATE emails SET read_status = 1 WHERE id = ?').bind(emailId).run();

  return c.json({ ...email, attachments });
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

// Send an email (via MailChannels)
app.post('/api/send', async (c) => {
  const userId = c.get('userId');
  const { to, subject, body } = await c.req.json();

  // Fetch admin email for the 'from' address
  const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const from = user.email;

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }]
        }
      ],
      from: {
        email: from,
        name: "Webmail"
      },
      subject: subject,
      content: [
        {
          type: "text/html",
          value: body
        }
      ]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    return c.json({ error: 'Failed to send email via Mailchannels', details: errorText }, 500);
  }

  // Save to Sent folder
  const sentFolder = await c.env.DB.prepare("SELECT id FROM folders WHERE user_id = ? AND type = 'sent'").bind(userId).first<{ id: string }>();
  if (sentFolder) {
    const emailId = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO emails (id, user_id, folder_id, sender, recipient, subject, html_body, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    ).bind(emailId, userId, sentFolder.id, `Webmail <${from}>`, to, subject, body).run();
  }

  return c.json({ success: true });
});

// Catch-all for React frontend routing
// app.get('*', serveStatic({ root: './' })); // Handled by Cloudflare Workers Assets automatically if configured

export default app;
