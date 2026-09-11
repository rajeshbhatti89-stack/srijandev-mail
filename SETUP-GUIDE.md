# Serverless Webmail Setup & Debugging Guide

Follow these exact steps to fix the "No emails here" issue and connect your frontend to Cloudflare properly.

## 1. Database Initialization (The Missing Link)

Your UI is empty because the `D1` database has not been initialized with the `admin@srijandev.in` user. If the email worker doesn't find the recipient in the DB, it rejects the email silently!

Run these commands in your terminal (inside your project directory) to execute `src/schema.sql` and set up the tables:

### Initialize Local DB (For local testing)
```bash
npx wrangler d1 execute DB --local --file=./src/schema.sql
```

### Initialize Production DB (For live Cloudflare)
```bash
npx wrangler d1 execute DB --remote --file=./src/schema.sql
```
*(This creates the `admin@srijandev.in` user and their `Inbox`, `Sent`, and `Drafts` folders in production).*

## 2. Environment Variables (`RESEND_API_KEY`)

Your worker needs the Resend API key to forward inbound emails and send outbound emails.

**DO NOT** hardcode this in `wrangler.toml`. Bind it securely as a secret.

### Set Secret Locally
Create a `.dev.vars` file in the root of your project:
```
RESEND_API_KEY=re_your_api_key_here
```

### Set Secret in Production
Run this command in your terminal:
```bash
npx wrangler secret put RESEND_API_KEY
```
*(Paste your key when prompted).*

## 3. Configure Cloudflare Email Routing

You must explicitly tell Cloudflare to send inbound emails to your Worker.
1. Go to your Cloudflare Dashboard -> **srijandev.in**.
2. Click **Email** -> **Email Routing** on the left sidebar.
3. Under the **Routes** tab, ensure you have a rule:
   - **Custom address:** `admin@srijandev.in` (or **Catch-all address**)
   - **Action:** `Send to a Worker`
   - **Destination:** `srijandev-platform-hub` (the name of your worker in `wrangler.toml`).

## 4. Testing Plan

Follow these steps to verify end-to-end delivery:

1. **Deploy your Worker:**
   ```bash
   npx wrangler deploy
   ```
2. **Send a Test Email:** Open your personal Gmail and send an email to `admin@srijandev.in`.
3. **Check Worker Logs:**
   Run the following command to see live logs from your worker processing the email:
   ```bash
   npx wrangler tail
   ```
   You should see:
   `Forwarding email via Resend for user admin@srijandev.in`
   `Email forwarded successfully via Resend`
4. **Check the Frontend UI:**
   Log into `mail.srijandev.in` with `admin@srijandev.in` (and whatever dummy password bypass your UI is using). The Inbox will now fetch from D1 and display your email!
