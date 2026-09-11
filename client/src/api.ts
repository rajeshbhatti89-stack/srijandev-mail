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
    useMailStore.getState().setAuth(null, false);
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
  
  getProfile: async () => {
    const res = await fetchWithAuth('/profile');
    return res.json();
  },
  
  updateProfile: async (data: { name: string; password?: string }) => {
    const res = await fetchWithAuth('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },
  
  getEmails: async (folderId: string, search: string = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetchWithAuth(`/folders/${folderId}/emails${query}`);
    return res.json();
  },
  
  getStarredEmails: async () => {
    const res = await fetchWithAuth(`/emails/starred`);
    return res.json();
  },
  
  getEmail: async (emailId: string) => {
    const res = await fetchWithAuth(`/emails/${emailId}`);
    return res.json();
  },
  
  toggleStar: async (emailId: string, is_starred: boolean) => {
    const res = await fetchWithAuth(`/emails/${emailId}/star`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred }),
    });
    return res.json();
  },
  
  moveEmail: async (emailId: string, folder_id: string) => {
    const res = await fetchWithAuth(`/emails/${emailId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id }),
    });
    return res.json();
  },
  
  sendEmail: async (data: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string;
    attachments?: { filename: string; content_type: string; content: string }[];
  }) => {
    const res = await fetchWithAuth('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send email');
    }
    return res.json();
  },

  getSettings: async (): Promise<{ max_attachment_size_mb: number }> => {
    const res = await fetchWithAuth('/settings');
    if (!res.ok) return { max_attachment_size_mb: 15 };
    return res.json();
  },

  updateAdminSettings: async (settings: { max_attachment_size_mb: number }) => {
    const res = await fetchWithAuth('/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  getContacts: async (): Promise<{ email: string; name: string; is_domain_user: boolean; is_admin: boolean }[]> => {
    const res = await fetchWithAuth('/contacts');
    if (!res.ok) return [];
    return res.json();
  },

  getAdminUsers: async (): Promise<{ id: string; name: string | null; email: string; is_admin: number; created_at: string }[]> => {
    const res = await fetchWithAuth('/admin/users');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch users');
    }
    return res.json();
  },

  deleteAdminUser: async (userId: string) => {
    const res = await fetchWithAuth(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete user');
    }
    return res.json();
  },

  createAdminUser: async (email: string, password: string, name?: string) => {
    const res = await fetchWithAuth('/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
  },

  getAttachmentUrl: (attachmentId: string) => {
    return `${API_BASE}/attachments/${attachmentId}`;
  }
};

