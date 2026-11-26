import sharp from 'sharp';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' } as const;
async function checkedImage(bytes: ArrayBuffer, contentType: string) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES || !Object.hasOwn(formats, contentType)) throw Error('Use JPEG, PNG ou WebP de até 5 MB.');
  const decoder = sharp(Buffer.from(bytes), { limitInputPixels: 20000000, failOn: 'warning', animated: false });
  const info = await decoder.metadata();
  if (info.format !== formats[contentType as keyof typeof formats] || !info.width || !info.height || info.width * info.height > 20000000 || (info.pages ?? 1) > 1) throw Error('Formato de imagem inválido ou dimensões excedidas.');
  return { decoder, longestEdge: Math.max(info.width, info.height) };
}

export async function normalizeImage(bytes: ArrayBuffer, contentType: string) {
  const { decoder } = await checkedImage(bytes, contentType);
  const output = await decoder.rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  if (output.byteLength > MAX_IMAGE_BYTES) throw Error('A imagem processada excede 5 MB.');
  return output;
}

export async function deliveryPreview(bytes: ArrayBuffer, contentType: string) {
  const { decoder, longestEdge } = await checkedImage(bytes, contentType);
  const size = Math.max(1, Math.min(1000, Math.floor(longestEdge * 0.7)));
  const { data, info } = await decoder.rotate().resize({ width: size, height: size, fit: 'inside' })
    .toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const fontSize = Math.min(width / 12, height / 4);
  const watermark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g transform="translate(${width / 2} ${height / 2}) rotate(-16)">
      <rect x="${-width / 2}" y="${-fontSize}" width="${width}" height="${fontSize * 2}" rx="${fontSize / 4}" fill="#18251e" fill-opacity="0.58"/>
      <text y="${fontSize * 0.34}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="#fff">MECENAS · PRÉVIA</text>
    </g>
  </svg>`);
  return sharp(data, { raw: { width, height, channels } }).composite([{ input: watermark }]).webp({ quality: 80 }).toBuffer();
}
