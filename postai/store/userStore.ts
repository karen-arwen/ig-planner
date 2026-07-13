import { create } from 'zustand';
import type { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setOnboarded: (v: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isOnboarded: false,

  setProfile: (profile) => set({ profile }),

  updateProfile: (updates) =>
    set((s) => ({
      profile: s.profile ? { ...s.profile, ...updates } : null,
    })),

  setOnboarded: (v) => set({ isOnboarded: v }),
}));
