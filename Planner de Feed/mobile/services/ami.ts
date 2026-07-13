import { ANTHROPIC_API_KEY, CONFIG } from '@/constants/config';
import type { ChatMessage, Photo } from '@/types';

const SYSTEM_PROMPT = `Você é a Ami, assistente pessoal de conteúdo para Instagram do app Postaí.
Você é amigável, direta e trabalha quase sozinha — seleciona, organiza, edita e planeja conteúdo.
Fale em português brasileiro, de forma descontraída mas profissional.
Quando o usuário pedir ações (organizar feed, escrever legenda, etc.), confirme o que vai fazer e execute.
Evite textos longos e repetitivos. Seja prática e objetiva.`;

export interface AmiContext {
  photos?: Photo[];
  feedSize?: number;
  userName?: string;
}

export async function sendMessageToAmi(
  messages: ChatMessage[],
  context: AmiContext = {}
): Promise<string> {
  const contextNote = buildContextNote(context);

  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const body = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT + (contextNote ? `\n\nContexto atual:\n${contextNote}` : ''),
    messages: apiMessages,
  };

  const response = await fetch(CONFIG.ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na API: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? 'Não consegui responder agora. Tenta de novo?';
}

export async function analyzePhoto(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  category: string;
  quality: string;
  colors: string[];
  note: string;
}> {
  const body = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `Analise esta foto para o Instagram. Responda APENAS com JSON no formato:
{
  "category": "selfie|look|produto|viagem|evento|comida|maquiagem|livro|setup|patrocinado|pessoal|bastidores|outro",
  "quality": "otima|boa|regular|ruim",
  "colors": ["cor1", "cor2"],
  "note": "observação breve sobre a foto"
}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(CONFIG.ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Falha na análise da foto');

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] ?? '{}');
  } catch {
    return { category: 'outro', quality: 'boa', colors: [], note: '' };
  }
}

export async function generateCaption(
  photoNote: string,
  category: string,
  style: string = 'natural'
): Promise<{ caption: string; hashtags: string[] }> {
  const body = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Crie uma legenda para Instagram para uma foto do tipo "${category}".
Estilo: ${style}. Contexto: ${photoNote}.
Responda APENAS com JSON: { "caption": "...", "hashtags": ["#tag1", "#tag2"] }`,
      },
    ],
  };

  const response = await fetch(CONFIG.ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Falha ao gerar legenda');

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] ?? '{}');
  } catch {
    return { caption: '', hashtags: [] };
  }
}

function buildContextNote(context: AmiContext): string {
  const parts: string[] = [];
  if (context.userName) parts.push(`Usuária: ${context.userName}`);
  if (context.photos?.length) parts.push(`Fotos na inbox: ${context.photos.length}`);
  if (context.feedSize) parts.push(`Posts no feed: ${context.feedSize}`);
  return parts.join(' | ');
}
