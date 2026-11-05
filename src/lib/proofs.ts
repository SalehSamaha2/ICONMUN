import type { SupabaseClient } from '@supabase/supabase-js';

export const PROOF_BUCKET = 'application-proofs';
export const MAX_PROOFS = 10;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // what a person may pick (phones take big photos)
const MAX_SIDE = 1800;                    // longest edge after shrinking

/** Quick checks before we even try to read a picked file. Returns a message, or '' when fine. */
export function checkProofFile(file: File): string {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: use a JPG, PNG or WebP image (photos in HEIC format are not supported).`;
  if (file.size > MAX_INPUT_BYTES) return `${file.name}: the image is larger than 15 MB.`;
  return '';
}

/** Shrinks a photo to a web-sized JPEG so uploads are fast and storage stays small. */
export async function prepareProof(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not available in this browser.');
  ctx.fillStyle = '#ffffff'; // transparent PNGs become white, not black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Could not process the image.');
  return blob;
}

/** Uploads the files into <applicationId>/ and returns the stored paths. Throws if any file fails. */
export async function uploadProofs(sb: SupabaseClient, applicationId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await prepareProof(files[i]);
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${applicationId}/${i + 1}-${rand}.jpg`;
    const { error } = await sb.storage.from(PROOF_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}
