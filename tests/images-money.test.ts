import { describe, test, expect } from 'vitest';
import sharp from 'sharp';
import { normalizeImage, MAX_IMAGE_BYTES } from '../lib/image-validation';
import { parseBRL } from '../lib/money';
function bytes(buffer: Buffer): ArrayBuffer { return new Uint8Array(buffer).buffer; }
describe('T11 money input', () => {
  test('preserves cents and rejects fractions, grouping and overflow', () => {
    for (const [input, cents] of [['50,51', 5051], ['1', 100], ['1000000.00', 100000000]] as const) expect(parseBRL(input)).toBe(cents);
    for (const input of ['0', '-1', '1,001', '1.000,00', '1000000,01', 'Infinity', '1e3', '', '50,']) expect(() => parseBRL(input)).toThrow();
  });
});
describe('T13/T14/T15 actual image decode', () => {
  test.each(['jpeg', 'png', 'webp'] as const)('normalizes %s bytes and strips metadata', async format => {
    const original = await sharp({ create: { width: 3000, height: 60, channels: 3, background: '#285747' } }).withMetadata({ orientation: 6 }).toFormat(format).toBuffer();
    const result = await normalizeImage(bytes(original), `image/${format}`);
    const metadata = await sharp(result).metadata();
    expect(metadata.format).toBe('webp'); expect(Math.max(metadata.width!, metadata.height!)).toBeLessThanOrEqual(2560); expect(metadata.exif).toBeUndefined(); expect(metadata.icc).toBeUndefined();
  });
  test('rejects mislabeled, fake, oversized, empty and excessive-pixel images', async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#285747' } }).png().toBuffer();
    await expect(normalizeImage(bytes(png), 'image/jpeg')).rejects.toThrow();
    await expect(normalizeImage(bytes(Buffer.from('<svg/>')), 'image/png')).rejects.toThrow();
    await expect(normalizeImage(new ArrayBuffer(MAX_IMAGE_BYTES + 1), 'image/png')).rejects.toThrow();
    await expect(normalizeImage(new ArrayBuffer(0), 'image/png')).rejects.toThrow();
    const big = await sharp({ create: { width: 5000, height: 4001, channels: 3, background: '#285747' } }).png().toBuffer();
    await expect(normalizeImage(bytes(big), 'image/png')).rejects.toThrow();
    await expect(normalizeImage(bytes(png), 'image/svg+xml')).rejects.toThrow();
  });
});
