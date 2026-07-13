import type { CSSProperties } from "react";
import type { PhotoFilter } from "@/types";

// Apply filters to image using Canvas API (client-side)
export function applyFiltersToCanvas(
  img: HTMLImageElement,
  filter: PhotoFilter
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Apply CSS filter string
  ctx.filter = buildCSSFilter(filter);
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function buildCSSFilter(filter: PhotoFilter): string {
  const brightness = filter.brightness / 100;
  const contrast = filter.contrast / 100;
  const saturation = filter.saturation / 100;

  // Warmth: use sepia + hue-rotate to simulate warmth
  const sepia = Math.max(0, filter.warmth / 100);
  const hueRotate = filter.warmth < 0 ? filter.warmth * 2 : 0;

  return [
    `brightness(${brightness})`,
    `contrast(${contrast})`,
    `saturate(${saturation})`,
    sepia > 0 ? `sepia(${sepia * 0.3})` : "",
    hueRotate !== 0 ? `hue-rotate(${hueRotate}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterToStyle(filter: PhotoFilter): CSSProperties {
  return {
    filter: buildCSSFilter(filter),
  };
}

// Default filter (no changes)
export const DEFAULT_FILTER: PhotoFilter = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  sharpness: 100,
};

// Apply AI suggestions to filter
export function applyAISuggestions(
  baseFilter: PhotoFilter,
  suggestions: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    warmth?: number;
  }
): PhotoFilter {
  return {
    brightness: Math.max(50, Math.min(200, baseFilter.brightness + (suggestions.brightness || 0))),
    contrast: Math.max(50, Math.min(200, baseFilter.contrast + (suggestions.contrast || 0))),
    saturation: Math.max(50, Math.min(200, baseFilter.saturation + (suggestions.saturation || 0))),
    warmth: Math.max(-50, Math.min(50, baseFilter.warmth + (suggestions.warmth || 0))),
    sharpness: baseFilter.sharpness,
  };
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Format date for scheduling
export function formatScheduleDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Calculate schedule dates
export function calculateScheduleDates(
  count: number,
  startDate: Date,
  frequency: "daily" | "every2days" | "twice_week" | "weekly"
): Date[] {
  const dates: Date[] = [];
  const intervalDays = {
    daily: 1,
    every2days: 2,
    twice_week: 3.5,
    weekly: 7,
  }[frequency];

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.round(i * intervalDays));
    date.setHours(18, 0, 0, 0); // Default 18:00
    dates.push(date);
  }

  return dates;
}
