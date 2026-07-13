import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import type { Photo, PhotoCategory, PhotoStatus } from '@/types';

interface PhotosState {
  photos: Photo[];
  selectedIds: string[];
  isAnalyzing: boolean;

  addPhotos: (photos: Photo[]) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  reorderPhotos: (orderedIds: string[]) => void;
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

/**
 * Copy a photo URI to the app's Documents directory so it survives
 * app restarts (picker URIs in Cache can be evicted).
 */
export async function persistPhotoUri(uri: string, id: string): Promise<string> {
  try {
    const dir = FileSystem.documentDirectory + 'postai-photos/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const dest = dir + id + '.' + ext;
    // Only copy if it's not already in our directory
    if (!uri.startsWith(dir)) {
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest;
    }
    return uri;
  } catch {
    return uri; // fallback to original
  }
}

export const usePhotosStore = create<PhotosState>()(
  persist(
    (set, get) => ({
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

      reorderPhotos: (orderedIds: string[]) =>
        set((s) => {
          const photoMap = new Map(s.photos.map((p) => [p.id, p]));
          const ordered: Photo[] = [];
          for (const id of orderedIds) {
            const photo = photoMap.get(id);
            if (photo) ordered.push(photo);
          }
          const mentioned = new Set(orderedIds);
          const rest = s.photos.filter((p) => !mentioned.has(p.id));
          return { photos: [...ordered, ...rest] };
        }),

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
    }),
    {
      name: 'postai-photos-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient UI state
      partialize: (state) => ({
        photos: state.photos,
      }),
    }
  )
);
