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

export interface Photo {
  id: string;
  uri: string;
  width: number;
  height: number;
  category: PhotoCategory;
  quality: PhotoQuality;
  status: PhotoStatus;
  caption?: string;
  hashtags?: string[];
  scheduledDate?: string;
  editedUri?: string;
  colors?: string[];
  analysisNote?: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'reorganize_feed' | 'edit_caption' | 'schedule_post' | 'analyze_photos';
  label: string;
  payload?: Record<string, unknown>;
}

export interface UserProfile {
  name: string;
  instagramHandle?: string;
  contentStyle: 'natural' | 'clara' | 'vibrante' | 'cinematografica' | 'delicada' | 'clean';
  nichos: PhotoCategory[];
  postFrequency: number;
  autonomyMode: 'manual' | 'assistido' | 'piloto';
}
