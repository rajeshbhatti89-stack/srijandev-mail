import { create } from 'zustand';

export interface Contact {
  email: string;
  name: string;
  avatar?: string;
  is_domain_user: boolean;
  is_admin: boolean;
}

interface MailState {
  token: string | null;
  isAdmin: boolean;
  setAuth: (token: string | null, isAdmin?: boolean) => void;
  currentFolder: string | null;
  setCurrentFolder: (folder: string | null) => void;
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string | null) => void;
  isComposeOpen: boolean;
  setComposeOpen: (isOpen: boolean) => void;
  view: 'mail' | 'admin';
  setView: (view: 'mail' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userProfile: any;
  setUserProfile: (profile: any) => void;
  isProfileModalOpen: boolean;
  isSidebarOpen: boolean;
  setProfileModalOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  maxAttachmentMb: number;
  setMaxAttachmentMb: (mb: number) => void;
  rememberContact: (email: string, name?: string) => void;
  emailsRefreshTrigger: number;
  triggerEmailsRefresh: () => void;
  draggedEmailIds: string[] | null;
  setDraggedEmailIds: (ids: string[] | null) => void;
}

export const useMailStore = create<MailState>((set, get) => ({
  token: localStorage.getItem('mail_token') || null,
  isAdmin: localStorage.getItem('mail_is_admin') === 'true',
  setAuth: (token, isAdmin = false) => {
    if (token) {
      localStorage.setItem('mail_token', token);
      localStorage.setItem('mail_is_admin', String(isAdmin));
    } else {
      localStorage.removeItem('mail_token');
      localStorage.removeItem('mail_is_admin');
    }
    set({ token, isAdmin, view: 'mail', currentFolder: null });
  },
  currentFolder: null, // We'll set this dynamically when folders load
  setCurrentFolder: (folder) => set({ currentFolder: folder, selectedEmailId: null }),
  selectedEmailId: null,
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  isComposeOpen: false,
  setComposeOpen: (isOpen) => set({ isComposeOpen: isOpen }),
  view: 'mail',
  setView: (view) => set({ view, selectedEmailId: null }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  isProfileModalOpen: false,
  isSidebarOpen: false,
  setProfileModalOpen: (isOpen) => set({ isProfileModalOpen: isOpen }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  maxAttachmentMb: 15,
  setMaxAttachmentMb: (maxAttachmentMb) => set({ maxAttachmentMb }),
  emailsRefreshTrigger: 0,
  triggerEmailsRefresh: () => set((state) => ({ emailsRefreshTrigger: state.emailsRefreshTrigger + 1 })),
  draggedEmailIds: null,
  setDraggedEmailIds: (draggedEmailIds) => set({ draggedEmailIds }),
  rememberContact: (email: string, name?: string) => {
    if (!email || !email.includes('@')) return;
    const current = get().contacts;
    const trimmedEmail = email.trim().toLowerCase();
    if (!current.some(c => c.email.toLowerCase() === trimmedEmail)) {
      const newContact: Contact = {
        email: email.trim(),
        name: name?.trim() || email.split('@')[0],
        is_domain_user: trimmedEmail.endsWith('@srijandev.in'),
        is_admin: false
      };
      set({ contacts: [newContact, ...current] });
    }
  }
}));

