import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzePhoto(base64Image: string, mimeType: string = "image/jpeg") {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Analise esta foto para um feed do Instagram. Responda APENAS com JSON válido neste formato exato:
{
  "category": "selfie|look|product|travel|food|event|lifestyle|other",
  "quality": "excellent|good|fair|poor",
  "description": "descrição curta em português",
  "suggestedCaption": "legenda criativa em português (max 150 chars)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "editSuggestion": "sugestão de edição em português",
  "colorPalette": ["#hex1", "#hex2"],
  "brightness": 0,
  "contrast": 0,
  "saturation": 0,
  "warmth": 0,
  "bestTimeToPost": "18:00"
}

brightness/contrast/saturation: valores de -50 a 50 indicando quanto ajustar (0 = sem mudança)
warmth: -30 a 30 (negativo = mais frio/azul, positivo = mais quente/amarelo)`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse AI response:", e);
  }

  return {
    category: "lifestyle",
    quality: "good",
    description: "Foto para o feed",
    suggestedCaption: "✨ Novo post chegando!",
    hashtags: ["lifestyle", "instagram", "photo"],
    editSuggestion: "Leve ajuste de brilho e contraste",
    colorPalette: ["#ffffff", "#000000"],
    brightness: 5,
    contrast: 5,
    saturation: 5,
    warmth: 0,
    bestTimeToPost: "18:00",
  };
}

export async function organizeFeed(photoDescriptions: string[]) {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Você é uma expert em estratégia de Instagram. Organize estas ${photoDescriptions.length} fotos na melhor ordem para um feed visualmente harmônico e estratégico.

Fotos (índice: descrição):
${photoDescriptions.map((d, i) => `${i}: ${d}`).join("\n")}

Responda APENAS com JSON:
{
  "order": [array com os índices na ordem ideal],
  "reasoning": "explicação curta em português",
  "tips": ["dica1", "dica2"]
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse feed organization:", e);
  }

  return {
    order: photoDescriptions.map((_, i) => i),
    reasoning: "Ordem original mantida",
    tips: [],
  };
}

export async function chatWithAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  feedContext: string
) {
  const systemPrompt = `Você é a Ami, assistente de IA do Postaí — o app de planejamento de feed para Instagram.
Você ajuda a usuária a organizar, editar e planejar o feed dela.
Seja direta, criativa e use emojis moderadamente.
Contexto atual do feed: ${feedContext}

Quando a usuária pedir mudanças, responda com o JSON das ações a tomar:
{
  "message": "sua resposta em português",
  "actions": [
    {"type": "reorder", "fromIndex": 0, "toIndex": 2},
    {"type": "editCaption", "photoIndex": 0, "caption": "nova legenda"},
    {"type": "deletePhoto", "photoIndex": 1},
    {"type": "updateSchedule", "photoIndex": 0, "date": "2024-01-15"}
  ]
}
Se não há ações, omita o campo "actions" ou deixe vazio.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Not JSON, just a text response
  }

  return { message: text, actions: [] };
}
