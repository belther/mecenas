import sharp from 'sharp';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' } as const;
export async function normalizeImage(bytes: ArrayBuffer, contentType: string) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES || !(contentType in formats)) throw Error('Use JPEG, PNG ou WebP de até 5 MB.');
  const decoder = sharp(Buffer.from(bytes), { limitInputPixels: 20000000, failOn: 'warning', animated: false });
  const info = await decoder.metadata();
  if (info.format !== formats[contentType as keyof typeof formats] || !info.width || !info.height || info.width * info.height > 20000000 || (info.pages ?? 1) > 1) throw Error('Formato de imagem inválido ou dimensões excedidas.');
  const output = await decoder.rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  if (output.byteLength > MAX_IMAGE_BYTES) throw Error('A imagem processada excede 5 MB.');
  return output;
}
