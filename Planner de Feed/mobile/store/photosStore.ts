import { create } from 'zustand';
import type { Photo, PhotoCategory, PhotoStatus } from '@/types';

interface PhotosState {
  photos: Photo[];
  selectedIds: string[];
  isAnalyzing: boolean;

  addPhotos: (photos: Photo[]) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  clearAll: () => void;

  selectPhoto: (id: string) => void;
  deselectPhoto: (id: string) => void;
  clearSelection: () => void;

  setAnalyzing: (v: boolean) => void;

  getByStatus: (status: PhotoStatus) => Photo[];
  getByCategory: (category: PhotoCategory) => Photo[];
  getInbox: () => Photo[];
  getReady: () => Photo[];
}

export const usePhotosStore = create<PhotosState>((set, get) => ({
  photos: [],
  selectedIds: [],
  isAnalyzing: false,

  addPhotos: (newPhotos) =>
    set((s) => ({ photos: [...s.photos, ...newPhotos] })),

  removePhoto: (id) =>
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),

  updatePhoto: (id, updates) =>
    set((s) => ({
      photos: s.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  clearAll: () => set({ photos: [], selectedIds: [] }),

  selectPhoto: (id) =>
    set((s) => ({ selectedIds: [...s.selectedIds, id] })),

  deselectPhoto: (id) =>
    set((s) => ({ selectedIds: s.selectedIds.filter((i) => i !== id) })),

  clearSelection: () => set({ selectedIds: [] }),

  setAnalyzing: (v) => set({ isAnalyzing: v }),

  getByStatus: (status) => get().photos.filter((p) => p.status === status),
  getByCategory: (category) => get().photos.filter((p) => p.category === category),
  getInbox: () => get().photos.filter((p) => p.status === 'inbox'),
  getReady: () => get().photos.filter((p) => p.status === 'pronto'),
}));
