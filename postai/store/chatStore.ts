import { create } from 'zustand';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;

  addMessage: (msg: ChatMessage) => void;
  setLoading: (v: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: '0',
      role: 'assistant',
      content: 'Oi! Sou a Ami, sua assistente de conteúdo 💜\n\nPosso organizar seu feed, escrever legendas, criar carrosséis e muito mais. O que vamos fazer hoje?',
      timestamp: new Date().toISOString(),
    },
  ],
  isLoading: false,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setLoading: (v) => set({ isLoading: v }),

  clearChat: () =>
    set({
      messages: [
        {
          id: '0',
          role: 'assistant',
          content: 'Oi! Sou a Ami, sua assistente de conteúdo 💜\n\nO que vamos fazer hoje?',
          timestamp: new Date().toISOString(),
        },
      ],
    }),
}));
