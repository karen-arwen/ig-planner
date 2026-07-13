/**
 * fal.ai image editing service.
 * Docs: https://fal.ai/models/fal-ai/flux/dev/image-to-image
 *
 * Setup: Add EXPO_PUBLIC_FAL_KEY to .env
 * Get key free at: https://fal.ai/dashboard/keys
 */

import * as FileSystem from 'expo-file-system';

const FAL_KEY = process.env.EXPO_PUBLIC_FAL_KEY ?? '';
const FAL_BASE = 'https://fal.run';

// ─── Upload local file to fal.ai storage → get public URL ────────────────────

async function uploadToFal(localUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  // fal.ai storage upload
  const uploadRes = await fetch(`${FAL_BASE}/storage/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content_type: mimeType,
      file_name: `postai-${Date.now()}.${ext}`,
    }),
  });

  if (!uploadRes.ok) {
    throw new Error(`fal.ai upload auth failed: ${uploadRes.status}`);
  }

  const { url, upload_url } = await uploadRes.json();

  // Upload binary to the signed URL
  const binaryRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: Buffer.from(base64, 'base64'),
  });

  if (!binaryRes.ok) {
    throw new Error('fal.ai binary upload failed');
  }

  return url as string; // public URL
}

// ─── Download result image to local Documents dir ─────────────────────────────

async function downloadResult(imageUrl: string, photoId: string): Promise<string> {
  const dir = FileSystem.documentDirectory + 'postai-photos/edited/';
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = dir + photoId + '_edited_' + Date.now() + '.jpg';

  const { uri } = await FileSystem.downloadAsync(imageUrl, dest);
  return uri;
}

// ─── AI image-to-image edit ───────────────────────────────────────────────────

export interface AIEditOptions {
  photoId: string;
  localUri: string;
  prompt: string;
  /** 0-1: how much to change (0=very subtle, 1=full change). Default 0.65 */
  strength?: number;
}

export interface AIEditResult {
  localUri: string; // saved path on device
  originalUrl: string; // fal.ai result URL
}

export async function applyAIEdit(options: AIEditOptions): Promise<AIEditResult> {
  if (!FAL_KEY) {
    throw new Error(
      'Chave fal.ai não configurada. Adicione EXPO_PUBLIC_FAL_KEY no arquivo .env.\nAcesse fal.ai/dashboard/keys para criar uma chave gratuita.'
    );
  }

  const { photoId, localUri, prompt, strength = 0.65 } = options;

  // 1. Upload source image
  const imageUrl = await uploadToFal(localUri);

  // 2. Call fal.ai flux image-to-image
  const editRes = await fetch(`${FAL_BASE}/fal-ai/flux/dev/image-to-image`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt: prompt,
      strength: strength,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!editRes.ok) {
    const err = await editRes.text();
    throw new Error(`fal.ai edit failed (${editRes.status}): ${err.slice(0, 200)}`);
  }

  const editData = await editRes.json();
  const resultUrl: string = editData.images?.[0]?.url;

  if (!resultUrl) {
    throw new Error('fal.ai não retornou imagem');
  }

  // 3. Download result to device
  const savedUri = await downloadResult(resultUrl, photoId);

  return { localUri: savedUri, originalUrl: resultUrl };
}

// ─── Generate design image from text ─────────────────────────────────────────

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
}

export async function generateImage(options: GenerateImageOptions): Promise<string> {
  if (!FAL_KEY) {
    throw new Error('Chave fal.ai não configurada. Adicione EXPO_PUBLIC_FAL_KEY no .env.');
  }

  const { prompt, aspectRatio = '1:1' } = options;

  const res = await fetch(`${FAL_BASE}/fal-ai/flux/schnell`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: aspectRatio === '1:1' ? 'square_hd' : aspectRatio === '9:16' ? 'portrait_4_3' : 'landscape_4_3',
      num_inference_steps: 4,
      num_images: 1,
    }),
  });

  if (!res.ok) {
    throw new Error(`fal.ai generate failed: ${res.status}`);
  }

  const data = await res.json();
  const url: string = data.images?.[0]?.url;
  if (!url) throw new Error('Sem imagem gerada');

  // Download to local storage
  const dir = FileSystem.documentDirectory + 'postai-photos/generated/';
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = dir + 'gen_' + Date.now() + '.jpg';
  const { uri } = await FileSystem.downloadAsync(url, dest);
  return uri;
}
