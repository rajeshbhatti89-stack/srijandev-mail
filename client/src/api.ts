import { useMailStore } from './store';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8787/api' : '/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useMailStore.getState().token;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (res.status === 401) {
    useMailStore.getState().setToken(null);
    throw new Error('Unauthorized');
  }
  
  return res;
}

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  
  getFolders: async () => {
    const res = await fetchWithAuth('/folders');
    return res.json();
  },
  
  getEmails: async (folderId: string) => {
    const res = await fetchWithAuth(`/folders/${folderId}/emails`);
    return res.json();
  },
  
  getEmail: async (emailId: string) => {
    const res = await fetchWithAuth(`/emails/${emailId}`);
    return res.json();
  },
  
  sendEmail: async (to: string, subject: string, body: string) => {
    const res = await fetchWithAuth('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  },

  getAttachmentUrl: (attachmentId: string) => {
    return `${API_BASE}/attachments/${attachmentId}`;
  }
};
