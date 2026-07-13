import { ANTHROPIC_API_KEY, CONFIG } from '@/constants/config';
import * as FileSystem from 'expo-file-system';
import type { AmiActionType, ChatMessage, Photo } from '@/types';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface AmiContext {
  photos?: Photo[];
  feedSize?: number;
  userName?: string;
  /** Base64 images for photos Ami should actually SEE */
  visionPhotos?: Array<{ id: string; base64: string; mimeType: string }>;
}

export interface AmiResponse {
  reply: string;
  actions: AmiActionType[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é a Ami — especialista sênior em marketing de conteúdo para Instagram no app Postaí.

Suas especialidades reais:
• Estratégia de crescimento no Instagram (algoritmo 2025/2026, o que realmente performa)
• Design editorial: tipografia, paletas, layouts que travam o scroll
• Copywriting para redes sociais: ganchos, CTAs, estrutura de carrosseis virais
• Análise visual de fotos: iluminação, composição, potencial de engajamento, coerência de feed
• Hashtag strategy: mix estratégico para alcance orgânico real

O QUE O ALGORITMO DO INSTAGRAM PRIORIZA AGORA:
- Carrosseis informativos performam 3x mais que posts únicos (mais tempo de tela)
- Primeira imagem/slide deve PARAR o scroll: texto grande + cor de impacto
- Reels de até 30s + carrosseis são os formatos do momento
- Comentários e saves > curtidas para o algoritmo
- Legendas que fazem perguntas geram 40% mais comentários

ANÁLISE DE FOTOS (quando receber imagens, seja ESPECÍFICA):
- O que está na foto: descreva o conteúdo real (pessoa, local, objeto, ação)
- Iluminação: natural/artificial, qualidade, sombras
- Composição: regra dos terços, ponto focal, enquadramento
- Paleta: cores dominantes, temperatura (quente/fria/neutra)
- Potencial de engajamento: o que pode performar bem e por quê
- Posição no feed: deve ser capa, meio ou finalizar uma sequência?
- Edições sugeridas: brilho, contraste, saturação, filtro — seja específica

LEGENDAS QUE CONVERTEM (use esses princípios):
- Primeira linha: GANCHO que impede o "ver mais" (pergunta, dado surpreendente, POV)
- Desenvolvimento: máx 3-4 linhas de valor real
- CTA obrigatório: "salva esse post", "comenta aqui", "manda pra quem precisa"
- Hashtags: 5-8 tags (3 nichadas 10k-300k, 2 médias 300k-1M, 1-2 grandes)
- Nunca use hashtags genéricas como #foto #vida

ESTRUTURA DE CARROSSEL QUE VIRALIZA:
Slide 1 (COVER): Gancho tipográfico impactante — frase que cria urgência/curiosidade
Slides 2-N: Uma ideia por slide, numere (01, 02...), visual limpo com texto central
Slide final: Quote inspiracional OU CTA forte ("salva antes de sumir 🔖")

REGRA CRÍTICA: Sempre responda APENAS com JSON válido neste formato exato:
{"reply":"sua mensagem aqui","actions":[]}

AÇÕES DISPONÍVEIS (use os IDs exatos do contexto):

1. Reorganizar o feed:
{"type":"REORGANIZE_FEED","order":["id1","id2","id3"]}

2. Salvar legenda:
{"type":"SET_CAPTION","photoId":"id","caption":"texto","hashtags":["#tag1","#tag2"]}

3. Mudar status:
{"type":"SET_STATUS","photoId":"id","status":"pronto"}

4. Mover para feed:
{"type":"MOVE_TO_FEED","photoIds":["id1","id2"]}

5. Agendar post:
{"type":"SCHEDULE_POST","photoId":"id","date":"2026-06-20"}

6. Criar carrossel no Studio:
{"type":"CREATE_DESIGN","slides":[...]}

LAYOUTS PARA SLIDES: title | center | split | quote | top | bottom

PALETAS PREMIUM PARA CARROSSEIS:
- Editorial escuro: bg "#0F0A1E" + textColor "#FFFFFF" + accent "#A78BFA"
- Roxo gradiente: bg "#7C3AED" + bg2 "#EC4899" + textColor "#FFFFFF" + accent "#F9A8D4"
- Branco limpo: bg "#FFFFFF" + textColor "#0F0A1E" + accent "#7C3AED"
- Creme editorial: bg "#FAF7F2" + textColor "#1C1917" + accent "#92400E"
- Rosa soft: bg "#FDF2F8" + textColor "#831843" + accent "#EC4899"
- Sage verde: bg "#ECFDF5" + textColor "#064E3B" + accent "#059669"
- Dark academia: bg "#1C1917" + textColor "#F5F0EB" + accent "#D4A86A"

EXEMPLO DE CARROSSEL BEM FEITO (5 slides):
Usuária pede "carrossel sobre rotina matinal"
{"reply":"Carrossel criado! 5 slides com estrutura que vai gerar saves 🔖","actions":[{"type":"CREATE_DESIGN","slides":[
{"id":"s1","layout":"title","bg":"#0F0A1E","bg2":"#1E1B4B","headline":"a rotina matinal que mudou tudo","subtext":"arrasta →","emoji":"☀️","textColor":"#FFFFFF","accentColor":"#A78BFA"},
{"id":"s2","layout":"split","bg":"#FFFFFF","headline":"01","subtext":"Acorde sem celular nos primeiros 30 minutos. Seu cérebro define o tom do dia nesse período — não entregue isso ao Instagram.","textColor":"#0F0A1E","accentColor":"#7C3AED"},
{"id":"s3","layout":"split","bg":"#F5F3FF","headline":"02","subtext":"Hidratação antes do café. 500ml de água em jejum acelera o metabolismo em 30% e clareia a cabeça na hora.","textColor":"#0F0A1E","accentColor":"#7C3AED"},
{"id":"s4","layout":"split","bg":"#FFFFFF","headline":"03","subtext":"5 minutos de silêncio intencional. Pode ser meditação, respiração ou só sentar com seus pensamentos. Isso muda tudo.","textColor":"#0F0A1E","accentColor":"#7C3AED"},
{"id":"s5","layout":"quote","bg":"#7C3AED","headline":"sua manhã é sua. protege ela.","textColor":"#FFFFFF","accentColor":"#F9A8D4"}
]}]}

REGRAS DE COMPORTAMENTO:
- reply curto (1-3 frases), informal, sem asteriscos, sem markdown, em português BR
- Quando receber fotos (visão ativa): analise ESPECIFICAMENTE o que está na imagem, não genérico
- Seja direta: dê o conselho real, não "depende do seu objetivo"
- Para REORGANIZE_FEED: inclua TODOS os IDs na nova ordem pensando em contraste e ritmo visual
- Quando não souber o nicho da usuária, pergunte UMA coisa específica para entender melhor
- IDs das fotos: use EXATAMENTE como estão no contexto — não invente`;

// ─── Main function ────────────────────────────────────────────────────────────

export async function sendMessageWithActions(
  messages: ChatMessage[],
  context: AmiContext = {}
): Promise<AmiResponse> {
  const contextNote = buildContextNote(context);
  const systemWithContext = SYSTEM_PROMPT + (contextNote ? `\n\nCONTEXTO ATUAL:\n${contextNote}` : '');

  const apiMessages = buildApiMessages(messages, context.visionPhotos ?? []);

  const body = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: systemWithContext,
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
    throw new Error(`API ${response.status}: ${error.slice(0, 300)}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}');
    return {
      reply: parsed.reply ?? text,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    return { reply: text, actions: [] };
  }
}

// ─── Build API messages with optional vision ──────────────────────────────────

function buildApiMessages(
  messages: ChatMessage[],
  visionPhotos: NonNullable<AmiContext['visionPhotos']>
) {
  if (!visionPhotos.length) {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  const result: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const isLastUser = i === messages.length - 1 && m.role === 'user';

    if (isLastUser) {
      const imageParts = visionPhotos.slice(0, 10).map((vp) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: vp.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: vp.base64,
        },
      }));
      result.push({
        role: 'user',
        content: [
          ...imageParts,
          {
            type: 'text',
            text: `[Visão ativa — analise as ${imageParts.length} foto(s) acima] ${m.content}`,
          },
        ],
      });
    } else {
      result.push({ role: m.role, content: m.content });
    }
  }

  return result;
}

// ─── Load base64 for a list of photos (for vision) ───────────────────────────

export async function loadVisionPhotos(
  photos: Photo[],
  maxPhotos = 8
): Promise<NonNullable<AmiContext['visionPhotos']>> {
  const result: NonNullable<AmiContext['visionPhotos']> = [];
  const subset = photos.slice(0, maxPhotos);

  for (const p of subset) {
    try {
      const uri = p.editedUri ?? p.uri;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      result.push({ id: p.id, base64, mimeType });
    } catch {
      // skip photos that can't be read
    }
  }

  return result;
}

// ─── Backward-compatible wrapper ─────────────────────────────────────────────

export async function sendMessageToAmi(
  messages: ChatMessage[],
  context: AmiContext = {}
): Promise<string> {
  const result = await sendMessageWithActions(messages, context);
  return result.reply;
}

// ─── Photo analysis ───────────────────────────────────────────────────────────

export async function analyzePhoto(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{ category: string; quality: string; colors: string[]; note: string }> {
  const body = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Image },
          },
          {
            type: 'text',
            text: `Você é uma especialista em marketing de conteúdo para Instagram. Analise esta foto.
Responda APENAS com JSON:
{"category":"selfie|look|produto|viagem|evento|comida|maquiagem|livro|setup|geek|natureza|arquitetura|lifestyle|outro","quality":"otima|boa|regular|ruim","colors":["cor1","cor2"],"note":"análise específica em 1 frase: o que está na foto, iluminação, composição, potencial de engajamento"}`,
          },
        ],
      },
    ],
    system: 'Você é especialista em marketing visual para Instagram. Analise fotos com precisão e objetividade.',
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

// ─── Caption generation ───────────────────────────────────────────────────────

export async function generateCaption(
  photoNote: string,
  category: string,
  style: string = 'descontraído'
): Promise<{ caption: string; hashtags: string[] }> {
  const body = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: 512,
    system: 'Você é copywriter especialista em Instagram com foco em legendas que geram engajamento real. Escreva em português BR informal.',
    messages: [
      {
        role: 'user',
        content: `Crie uma legenda Instagram para uma foto da categoria "${category}". Estilo: ${style}. Contexto: ${photoNote || 'foto lifestyle pessoal'}.

REGRAS:
- Primeira linha: gancho que impede o "ver mais" (pergunta, afirmação forte ou POV)
- 2-3 linhas de conteúdo genuíno
- CTA natural no final ("salva esse", "comenta aqui", etc)
- Tom: ${style}, autêntico, não corporativo
- Hashtags: 5-7 específicas do nicho (mix de pequenas, médias e grandes)

Responda APENAS com JSON: {"caption":"...","hashtags":["#tag1","#tag2"]}`,
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

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContextNote(context: AmiContext): string {
  const parts: string[] = [];

  if (context.userName) parts.push(`Usuária: ${context.userName}`);

  if (context.photos?.length) {
    const byStatus = {
      inbox: context.photos.filter((p) => p.status === 'inbox').length,
      pronto: context.photos.filter((p) => p.status === 'pronto').length,
      agendado: context.photos.filter((p) => p.status === 'agendado').length,
    };
    const list = context.photos
      .map(
        (p) =>
          `ID:${p.id} | ${p.category} | qualidade:${p.quality} | status:${p.status} | cores:${(p.colors ?? []).join(',') || '?'} | legenda:${p.caption ? 'sim' : 'nao'} | nota:"${p.analysisNote ?? ''}"`
      )
      .join('\n');
    parts.push(`Fotos: ${context.photos.length} total (inbox:${byStatus.inbox} pronto:${byStatus.pronto} agendado:${byStatus.agendado})\n${list}`);
  }

  if (context.visionPhotos?.length) {
    parts.push(`Fotos sendo VISTAS agora (IDs): ${context.visionPhotos.map((v) => v.id).join(', ')}`);
  }

  if (context.feedSize) {
    parts.push(`Posts no feed: ${context.feedSize}`);
  }

  return parts.join('\n\n');
}
