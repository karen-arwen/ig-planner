"use client";

// ─── IndexedDB for images ───────────────────────────────────────────────────
const DB_NAME = "postai-db";
const DB_VERSION = 1;
const STORE_IMAGES = "images";
const STORE_META = "metadata";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_IMAGES);
      req.result.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImageToDB(id: string, file: File): Promise<void> {
  const db = await openDB();
  const buf = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).put({ buf, type: file.type, name: file.name }, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadImageFromDB(id: string): Promise<{ url: string; type: string } | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_IMAGES, "readonly");
    const req = tx.objectStore(STORE_IMAGES).get(id);
    req.onsuccess = () => {
      if (!req.result) { resolve(null); return; }
      const blob = new Blob([req.result.buf], { type: req.result.type });
      resolve({ url: URL.createObjectURL(blob), type: req.result.type });
    };
    req.onerror = () => resolve(null);
  });
}

export async function deleteImageFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).delete(id);
    tx.oncomplete = () => resolve();
  });
}

export async function getAllImageIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_IMAGES, "readonly");
    const req = tx.objectStore(STORE_IMAGES).getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => resolve([]);
  });
}

export async function clearAllImages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).clear();
    tx.oncomplete = () => resolve();
  });
}

// ─── localStorage for metadata ────────────────────────────────────────────────
const LS_KEY = "postai-photos-meta";
const LS_VIEW = "postai-viewmode";

export interface SerializedPhoto {
  id: string;
  filter: Record<string, number>;
  analysis?: Record<string, unknown>;
  caption: string;
  hashtags: string[];
  scheduledDate?: string;
  position: number;
  approved: boolean;
  feedPosition?: number;
  status: string;
}

export function saveMetaToLS(photos: SerializedPhoto[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(photos));
  } catch { /* quota exceeded - skip */ }
}

export function loadMetaFromLS(): SerializedPhoto[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveViewMode(mode: string): void {
  localStorage.setItem(LS_VIEW, mode);
}

export function loadViewMode(): string | null {
  return localStorage.getItem(LS_VIEW);
}

export function clearStorage(): void {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_VIEW);
  clearAllImages();
}
