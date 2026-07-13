export type PhotoStatus = "pending" | "analyzing" | "enhanced" | "approved" | "rejected";

export interface PhotoFilter {
  brightness: number;   // 0-200, default 100
  contrast: number;     // 0-200, default 100
  saturation: number;   // 0-200, default 100
  warmth: number;       // -50 to 50, default 0
  sharpness: number;    // 0-200, default 100
}

export interface AIAnalysis {
  category: "selfie" | "look" | "product" | "travel" | "food" | "event" | "lifestyle" | "other";
  quality: "excellent" | "good" | "fair" | "poor";
  description: string;
  suggestedCaption: string;
  hashtags: string[];
  editSuggestion: string;
  colorPalette: string[];
  bestTimeToPost?: string;
}

export interface Photo {
  id: string;
  file?: File;
  originalUrl: string;
  enhancedUrl?: string;
  previewUrl: string;
  status: PhotoStatus;
  filter: PhotoFilter;
  analysis?: AIAnalysis;
  caption: string;
  hashtags: string[];
  scheduledDate?: Date;
  position: number;
  approved: boolean;
  feedPosition?: number;
}

export interface FeedPlan {
  photos: Photo[];
  startDate: Date;
  frequency: "daily" | "every2days" | "twice_week" | "weekly";
  aiSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
