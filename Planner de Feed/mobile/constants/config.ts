export const CONFIG = {
  APP_NAME: 'Postaí',
  AMI_NAME: 'Ami',
  AMI_DESCRIPTION: 'Sua assistente de conteúdo',
  ANTHROPIC_API_URL: 'https://api.anthropic.com/v1/messages',
  ANTHROPIC_MODEL: 'claude-opus-4-5',
  MAX_PHOTOS_PER_BATCH: 50,
  FEED_COLUMNS: 3,
} as const;

// Coloque sua chave no .env
export const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';
