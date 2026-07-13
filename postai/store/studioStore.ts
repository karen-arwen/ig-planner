import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Design, DesignSlide } from '@/types';

interface StudioState {
  designs: Design[];
  addDesign: (design: Design) => void;
  updateDesign: (id: string, updates: Partial<Design>) => void;
  updateSlide: (designId: string, slideId: string, updates: Partial<DesignSlide>) => void;
  removeDesign: (id: string) => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      designs: [],

      addDesign: (design) =>
        set((s) => ({ designs: [design, ...s.designs] })),

      updateDesign: (id, updates) =>
        set((s) => ({
          designs: s.designs.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      updateSlide: (designId, slideId, updates) =>
        set((s) => ({
          designs: s.designs.map((d) =>
            d.id === designId
              ? {
                  ...d,
                  slides: d.slides.map((sl) =>
                    sl.id === slideId ? { ...sl, ...updates } : sl
                  ),
                }
              : d
          ),
        })),

      removeDesign: (id) =>
        set((s) => ({ designs: s.designs.filter((d) => d.id !== id) })),
    }),
    {
      name: 'postai-studio-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
