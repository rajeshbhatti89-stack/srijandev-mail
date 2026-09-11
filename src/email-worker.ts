import PostalMime from 'postal-mime';
import { Env } from './index';

export async function handleEmail(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
  try {
    const parser = new PostalMime();
    
    // Read the raw email stream
    const rawEmail = new Response(message.raw);
    const arrayBuffer = await rawEmail.arrayBuffer();
    
    // Parse the email
    const parsedEmail = await parser.parse(arrayBuffer);
    
    // Cleanly extract sender name and email address
    let sender = message.from;
    const fromData: any = parsedEmail.from;
    if (fromData) {
      if (typeof fromData === 'string') {
        sender = fromData.trim();
      } else if (fromData.name && fromData.address) {
        sender = `"${fromData.name.trim()}" <${fromData.address.trim()}>`;
      } else if (fromData.address) {
        sender = fromData.address.trim();
      } else if (fromData.text) {
        sender = fromData.text.trim();
      }
    }
    const recipient = message.to;
    const subject = parsedEmail.subject || '(No Subject)';
    const textBody = parsedEmail.text || '';
    const htmlBody = parsedEmail.html || '';

    // Find the recipient in our users table
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(recipient).first<{ id: string }>();
    
    if (!user) {
      console.log(`Email received for unknown user: ${recipient}`);
      message.setReject('User not found');
      return;
    }

    const userId = user.id;

    // Get the Inbox folder for the user
    const inbox = await env.DB.prepare("SELECT id FROM folders WHERE user_id = ? AND type = 'inbox'").bind(userId).first<{ id: string }>();
    if (!inbox) {
      console.log(`Inbox folder not found for user: ${userId}`);
      return;
    }

    const emailId = crypto.randomUUID();

    // Insert the email into the database
    await env.DB.prepare(
      'INSERT INTO emails (id, user_id, folder_id, sender, recipient, subject, text_body, html_body, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
    ).bind(emailId, userId, inbox.id, sender, recipient, subject, textBody, htmlBody).run();

    // Process attachments
    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
      for (const attachment of parsedEmail.attachments) {
        const attachmentId = crypto.randomUUID();
        
        const attContent: any = attachment.content;
        const attSize = attContent ? (attContent.byteLength ?? attContent.length ?? 0) : 0;
        
        // Save metadata and content to DB
        await env.DB.prepare(
          'INSERT INTO attachments (id, email_id, filename, content_type, size, content) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(attachmentId, emailId, attachment.filename, attachment.mimeType, attSize, attachment.content).run();
      }
    }
    
    // [NEW] Forward the email using Resend API
    if (env.RESEND_API_KEY) {
      try {
        console.log(`Forwarding email via Resend for user ${recipient}`);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Webmail Forwarder <admin@srijandev.in>', // Must be a verified domain in Resend
            to: ['admin@srijandev.in'], // Where to forward notifications
            subject: `[Fwd] ${subject}`,
            html: `<p><strong>From:</strong> ${sender}</p>
                   <p><strong>To:</strong> ${recipient}</p>
                   <hr/>
                   ${htmlBody || `<pre>${textBody}</pre>`}`
          })
        });
        
        if (!res.ok) {
          console.error('Failed to forward via Resend:', await res.text());
        } else {
          console.log('Email forwarded successfully via Resend');
        }
      } catch (fwdErr) {
        console.error('Error in Resend forwarding:', fwdErr);
      }
    }

  } catch (error) {
    console.error('Error processing incoming email:', error);
    message.setReject('Temporary error processing email');
  }
}
