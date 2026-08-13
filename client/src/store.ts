import { create } from 'zustand';

interface MailState {
  token: string | null;
  setToken: (token: string | null) => void;
  currentFolder: string;
  setCurrentFolder: (folder: string) => void;
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string | null) => void;
  isComposeOpen: boolean;
  setComposeOpen: (isOpen: boolean) => void;
}

export const useMailStore = create<MailState>((set) => ({
  token: localStorage.getItem('mail_token') || null,
  setToken: (token) => {
    if (token) localStorage.setItem('mail_token', token);
    else localStorage.removeItem('mail_token');
    set({ token });
  },
  currentFolder: 'inbox-1', // Default to admin's inbox
  setCurrentFolder: (folder) => set({ currentFolder: folder, selectedEmailId: null }),
  selectedEmailId: null,
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  isComposeOpen: false,
  setComposeOpen: (isOpen) => set({ isComposeOpen: isOpen }),
}));
