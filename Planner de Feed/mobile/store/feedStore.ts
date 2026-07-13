import { create } from 'zustand';
import type { FeedPost } from '@/types';

interface FeedState {
  posts: FeedPost[];
  isOrganizing: boolean;

  setPosts: (posts: FeedPost[]) => void;
  addPost: (post: FeedPost) => void;
  removePost: (id: string) => void;
  updatePost: (id: string, updates: Partial<FeedPost>) => void;
  reorderPosts: (from: number, to: number) => void;
  setOrganizing: (v: boolean) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isOrganizing: false,

  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((s) => ({ posts: [...s.posts, post] })),

  removePost: (id) =>
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

  updatePost: (id, updates) =>
    set((s) => ({
      posts: s.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  reorderPosts: (from, to) =>
    set((s) => {
      const posts = [...s.posts];
      const [moved] = posts.splice(from, 1);
      posts.splice(to, 0, moved);
      return {
        posts: posts.map((p, i) => ({ ...p, position: i })),
      };
    }),

  setOrganizing: (v) => set({ isOrganizing: v }),
}));
