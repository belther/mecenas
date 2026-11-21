// Original Mecenas video asset renderer, written 2026-11-20.
// Input: canonical SVG. Output: 1920x1080 PNG, no network or credentials.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = fileURLToPath(new URL('../docs/video/fluxo-mecenas.svg', import.meta.url));
const png = fileURLToPath(new URL('../docs/video/fluxo-mecenas.png', import.meta.url));
await sharp(svg).png().toFile(png);
console.log(`Rendered video graphic: ${png}`);
