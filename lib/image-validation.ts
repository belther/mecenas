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

// Stroke glyphs on a 4 x 6 grid. Server runtimes (Convex Node actions) have no fonts, so SVG
// <text> rendered as empty boxes; vector strokes render the same everywhere (iteration 007).
const GLYPHS: Record<string, string> = {
  M: 'M0 6L0 0L2 3L4 0L4 6', E: 'M4 0L0 0L0 6L4 6M0 3L3 3', C: 'M4 0L0 0L0 6L4 6', N: 'M0 6L0 0L4 6L4 0',
  A: 'M0 6L2 0L4 6M1 3L3 3', S: 'M4 0L0 0L0 3L4 3L4 6L0 6', P: 'M0 6L0 0L4 0L4 3L0 3', R: 'M0 6L0 0L4 0L4 3L0 3M2 3L4 6',
  É: 'M4 0L0 0L0 6L4 6M0 3L3 3M1.5 -1L3 -2', V: 'M0 0L2 6L4 0', I: 'M2 0L2 6', '·': 'M1.7 3L2.3 3', ' ': '',
};
/** Vector text centred on the origin; `height` is the cap height in pixels. */
export function vectorText(text: string, height: number, colour = '#fff') {
  const unit = height / 6, advance = 6, width = text.length * advance - 2;
  const paths = [...text].map((char, index) => {
    const d = GLYPHS[char];
    if (d === undefined) throw Error(`Glyph not available: ${char}`);
    return d ? `<path transform="translate(${index * advance} 0)" d="${d}"/>` : '';
  }).join('');
  return `<g transform="scale(${unit}) translate(${-width / 2} -3)" fill="none" stroke="${colour}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
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
      ${vectorText('MECENAS · PRÉVIA', fontSize * 0.7)}
    </g>
  </svg>`);
  return sharp(data, { raw: { width, height, channels } }).composite([{ input: watermark }]).webp({ quality: 80 }).toBuffer();
}
