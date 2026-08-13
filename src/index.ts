import app from './server';
import { handleEmail } from './email-worker';

export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string; // Optional: for outbound mail
}

export default {
  // HTTP Handler (REST API)
  fetch: app.fetch,

  // Email Routing Handler (Inbound Mail)
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    await handleEmail(message, env, ctx);
  }
};
