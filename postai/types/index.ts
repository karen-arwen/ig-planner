export type PhotoCategory =
  | 'selfie'
  | 'look'
  | 'produto'
  | 'viagem'
  | 'evento'
  | 'comida'
  | 'maquiagem'
  | 'livro'
  | 'setup'
  | 'patrocinado'
  | 'pessoal'
  | 'bastidores'
  | 'outro';

export type PhotoQuality = 'otima' | 'boa' | 'regular' | 'ruim';

export type PhotoStatus = 'inbox' | 'pronto' | 'agendado' | 'publicado' | 'arquivo';

// ---- Photo edits (applied in editor, stored with photo) ----
export interface PhotoEdits {
  brightness: number;  // -1 to 1, default 0
  contrast: number;    // 0 to 2, default 1
  saturation: number;  // 0 to 2, default 1
  filterName: string;  // preset name
  textOverlay?: { text: string; x: number; y: number; size: number; color: string };
  aiEditPrompt?: string;
}

export interface Photo {
  id: string;
  uri: string;           // original URI (stable, in Documents dir)
  editedUri?: string;    // saved edit result (if exported)
  width: number;
  height: number;
  category: PhotoCategory;
  quality: PhotoQuality;
  status: PhotoStatus;
  caption?: string;
  hashtags?: string[];
  scheduledDate?: string;
  colors?: string[];
  analysisNote?: string;
  edits?: PhotoEdits;    // live editor state
  createdAt: string;
}

export interface FeedPost {
  id: string;
  photoId: string;
  position: number;
  caption: string;
  hashtags: string[];
  scheduledDate?: string;
  status: 'rascunho' | 'agendado' | 'publicado';
}

// ---- Studio designs ----
export type SlideLayout = 'center' | 'top' | 'bottom' | 'split' | 'quote' | 'title';

export interface DesignSlide {
  id: string;
  layout: SlideLayout;
  bg: string;          // background color or gradient stop
  bg2?: string;        // gradient second color
  headline: string;
  subtext?: string;
  emoji?: string;
  textColor: string;
  accentColor: string;
}

export interface Design {
  id: string;
  title: string;
  slides: DesignSlide[];
  createdAt: string;
  status: 'rascunho' | 'pronto';
}

// ---- Actions that Ami can execute ----
export type AmiActionType =
  | { type: 'REORGANIZE_FEED'; order: string[] }
  | { type: 'SET_CAPTION'; photoId: string; caption: string; hashtags: string[] }
  | { type: 'SET_STATUS'; photoId: string; status: PhotoStatus }
  | { type: 'MOVE_TO_FEED'; photoIds: string[] }
  | { type: 'SCHEDULE_POST'; photoId: string; date: string }
  | { type: 'CREATE_DESIGN'; slides: DesignSlide[] };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedActions?: string[];
  attachedPhotoIds?: string[]; // which photos Ami saw
}

export interface UserProfile {
  name: string;
  instagramHandle?: string;
  contentStyle: 'natural' | 'clara' | 'vibrante' | 'cinematografica' | 'delicada' | 'clean';
  nichos: PhotoCategory[];
  postFrequency: number;
  autonomyMode: 'manual' | 'assistido' | 'piloto';
}
