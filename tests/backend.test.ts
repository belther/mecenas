import { describe, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { registerCore, sessionIdentity } from '@convex-dev/auth/test';
import { registerPassword } from '@convex-dev/auth/components/password/test';
import { registerUsername } from '@convex-dev/auth/components/username/test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import sharp from 'sharp';

const modules = import.meta.glob('../convex/**/*.ts');
// Synthetic issuer required by the real auth component; no cloud connection.
vi.stubEnv('CONVEX_CLOUD_URL', 'https://synthetic-test.convex.cloud');
const profile = (role: 'artist' | 'client', name = 'Pessoa Sintética') => ({ role, displayName: name, bio: '', portfolioUploadIds: [] });
const request = { title: 'Ilustração de jardim', description: 'Uma ilustração sintética com folhas e flores para demonstração.', pricePerArtistCents: 5000, artistSlots: 1, exampleUploadIds: [] };
function setup() { const t = convexTest(schema, modules); registerCore(t); registerPassword(t); registerUsername(t); return t; }
type Harness = ReturnType<typeof setup>;
async function actor(t: Harness, username: string, role: 'artist' | 'client') {
  vi.stubEnv('MECENAS_DEMO_USERNAMES', username);
  const result = await t.mutation(api.auth.signUpWithUsernamePassword, { username, password: crypto.randomUUID() + 'aA9!' });
  if (result.status !== 'complete') throw Error('Synthetic sign-up failed');
  const user = t.withIdentity(sessionIdentity(result.tokens));
  await user.mutation(api.profiles.save, profile(role));
  return { user, tokens: result.tokens };
}

describe('frozen initial design: backend outcomes', () => {
  test('T01 session revocation removes access, valid password and invalid password differ', async () => {
    const t = setup(); const password = crypto.randomUUID() + 'aA9!';
    vi.stubEnv('MECENAS_DEMO_USERNAMES', 'demo-session');
    await t.mutation(api.auth.signUpWithUsernamePassword, { username: 'demo-session', password });
    const invalid = await t.mutation(api.auth.signInWithUsernamePassword, { username: 'demo-session', password: 'Incorrect-password-98!' });
    expect(invalid.status).toBe('error');
    const signed = await t.mutation(api.auth.signInWithUsernamePassword, { username: 'demo-session', password });
    if (signed.status !== 'complete') throw Error('Sign-in failed');
    const user = t.withIdentity(sessionIdentity(signed.tokens));
    const refreshed = await t.mutation(api.auth.refreshSession, { refreshToken: signed.tokens.refreshToken });
    expect(refreshed).not.toBeNull();
    await user.mutation(api.profiles.save, profile('artist'));
    await t.mutation(api.auth.signOut, { refreshToken: signed.tokens.refreshToken });
    await expect(user.mutation(api.profiles.save, profile('artist'))).rejects.toThrow();
  });
  test('T02 anonymous direct calls fail closed', async () => {
    const t = setup();
    await expect(t.mutation(api.profiles.save, profile('artist'))).rejects.toThrow();
    await expect(t.mutation(api.requests.saveDraft, request)).rejects.toThrow();
    await expect(t.query(api.requests.mine, {})).rejects.toThrow();
    expect(await t.query(api.profiles.me, {})).toBeNull();
  });
  test('T03/T04 own profile persists; one profile per identity and immutable role', async () => {
    const t = setup(); const { user } = await actor(t, 'demo-artist', 'artist');
    const before = await user.query(api.profiles.me, {});
    await user.mutation(api.profiles.save, profile('artist', 'Artista Atualizado'));
    const after = await user.query(api.profiles.me, {});
    expect(after?._id).toBe(before?._id); expect(after?.displayName).toBe('Artista Atualizado');
    await expect(user.mutation(api.profiles.save, profile('client'))).rejects.toThrow();
    expect((await t.run(ctx => ctx.db.query('profiles').collect())).length).toBe(1);
  });
  test('T06 profile text validation is server-side and atomic', async () => {
    const t = setup(); const { user } = await actor(t, 'demo-length', 'artist');
    for (const displayName of ['x', 'x'.repeat(61), '  ']) await expect(user.mutation(api.profiles.save, profile('artist', displayName))).rejects.toThrow();
    await expect(user.mutation(api.profiles.save, { ...profile('artist'), bio: 'x'.repeat(1001) })).rejects.toThrow();
    expect((await user.query(api.profiles.me, {}))?.displayName).toBe('Pessoa Sintética');
  });
  test('T07/T09 lifecycle persists draft edits, then publishes exactly once', async () => {
    const t = setup(); const { user: client } = await actor(t, 'demo-client', 'client'); const { user: artist } = await actor(t, 'demo-viewer', 'artist');
    const id = await client.mutation(api.requests.saveDraft, request);
    expect(await artist.query(api.requests.browse, {})).toHaveLength(0);
    await client.mutation(api.requests.saveDraft, { ...request, id, pricePerArtistCents: 5051 });
    expect((await client.query(api.requests.mine, {}))[0]).toMatchObject({ _id: id, pricePerArtistCents: 5051, artType: 'illustration', status: 'draft' });
    await client.mutation(api.requests.publish, { id }); await client.mutation(api.requests.publish, { id });
    expect(await artist.query(api.requests.browse, {})).toHaveLength(1);
    await expect(client.mutation(api.requests.saveDraft, { ...request, id })).rejects.toThrow();
  });
  test('T08/T10 unauthorized roles and cross-account access are denied', async () => {
    const t = setup(); const { user: owner } = await actor(t, 'demo-owner', 'client'); const { user: other } = await actor(t, 'demo-other', 'client'); const { user: artist } = await actor(t, 'demo-art', 'artist');
    const id = await owner.mutation(api.requests.saveDraft, request);
    for (const user of [other, artist]) { await expect(user.mutation(api.requests.saveDraft, { ...request, id })).rejects.toThrow(); await expect(user.mutation(api.requests.publish, { id })).rejects.toThrow(); await expect(user.query(api.requests.get, { id })).rejects.toThrow(); }
    await expect(artist.mutation(api.requests.saveDraft, request)).rejects.toThrow();
    await expect(other.query(api.requests.browse, {})).rejects.toThrow();
    await owner.mutation(api.requests.publish, { id });
    const published = await artist.query(api.requests.get, { id });
    expect(published).not.toHaveProperty('userId'); expect(published).not.toHaveProperty('tokenIdentifier');
  });
  test('T11/T12 exact cents, text and slot limits reject malformed direct submissions', async () => {
    const t = setup(); const { user } = await actor(t, 'demo-money', 'client');
    for (const pricePerArtistCents of [0, -1, 99, 100000001, 100.5, Number.MAX_SAFE_INTEGER]) await expect(user.mutation(api.requests.saveDraft, { ...request, pricePerArtistCents })).rejects.toThrow();
    for (const artistSlots of [0, 11, 1.5]) await expect(user.mutation(api.requests.saveDraft, { ...request, artistSlots })).rejects.toThrow();
    await expect(user.mutation(api.requests.saveDraft, { ...request, title: 'curt' })).rejects.toThrow();
    for (const pricePerArtistCents of [100, 101, 100000000]) await user.mutation(api.requests.saveDraft, { ...request, pricePerArtistCents });
    expect((await user.query(api.requests.mine, {})).map(r => r.pricePerArtistCents).sort((a, b) => a-b)).toEqual([100, 101, 100000000]);
  });
  test('T05/T16/T17/T19 attachments enforce ownership, purpose, uniqueness and count', async () => {
    const t = setup(); const { user: artist, tokens } = await actor(t, 'demo-upload-a', 'artist'); const { user: other, tokens: otherTokens } = await actor(t, 'demo-upload-b', 'artist');
    const ids = await t.run(async ctx => { const storageId = await ctx.storage.store(new Blob(['synthetic fixture'])); return Promise.all(Array.from({ length: 7 }, () => ctx.db.insert('uploads', { userId: tokens.userId as never, storageId, purpose: 'portfolio' as const, contentType: 'image/png', size: 17 }))); });
    await artist.mutation(api.profiles.save, { ...profile('artist'), portfolioUploadIds: ids.slice(0, 6) });
    await expect(artist.mutation(api.profiles.save, { ...profile('artist'), portfolioUploadIds: ids })).rejects.toThrow();
    await expect(artist.mutation(api.profiles.save, { ...profile('artist'), portfolioUploadIds: [ids[0], ids[0]] })).rejects.toThrow();
    await expect(other.mutation(api.profiles.save, { ...profile('artist'), portfolioUploadIds: [ids[0]] })).rejects.toThrow();
    expect(otherTokens.userId).not.toBe(tokens.userId);
  });
  test('T20 publication revalidates persisted draft and remains atomic on failure', async () => {
    const t = setup(); const { user: client } = await actor(t, 'demo-publish', 'client'); const { user: artist } = await actor(t, 'demo-browse', 'artist');
    const id = await client.mutation(api.requests.saveDraft, request);
    await t.run(ctx => ctx.db.patch(id, { pricePerArtistCents: -1 }));
    await expect(client.mutation(api.requests.publish, { id })).rejects.toThrow();
    expect(await artist.query(api.requests.browse, {})).toHaveLength(0);
    expect((await client.query(api.requests.mine, {}))[0].status).toBe('draft');
  });
  test('T13/T14/T16/T18 upload action stores normalized files only and protects draft previews', async () => {
    const t = setup(); const { user: owner } = await actor(t, 'demo-images', 'client'); const { user: artist } = await actor(t, 'demo-image-viewer', 'artist');
    const png = new Uint8Array(await sharp({ create: { width: 12, height: 10, channels: 3, background: '#285747' } }).png().toBuffer()).buffer;
    await expect(t.action(api.uploads.create, { bytes: png, contentType: 'image/png', purpose: 'reference' })).rejects.toThrow();
    await expect(artist.action(api.uploads.create, { bytes: png, contentType: 'image/png', purpose: 'reference' })).rejects.toThrow();
    await expect(owner.action(api.uploads.create, { bytes: png, contentType: 'image/jpeg', purpose: 'reference' })).rejects.toThrow();
    expect(await t.run(ctx => ctx.db.query('uploads').collect())).toHaveLength(0);
    const upload = await owner.action(api.uploads.create, { bytes: png, contentType: 'image/png', purpose: 'reference' });
    expect(await owner.action(api.uploads.preview, { id: upload })).toBeTypeOf('string');
    await expect(artist.action(api.uploads.preview, { id: upload })).rejects.toThrow();
    const id = await owner.mutation(api.requests.saveDraft, { ...request, exampleUploadIds: [upload] });
    await expect(artist.query(api.requests.get, { id })).rejects.toThrow();
    await owner.mutation(api.requests.publish, { id });
    expect((await artist.query(api.requests.get, { id })).images[0]).toBeTypeOf('string');
    const record = (await t.run(ctx => ctx.db.query('uploads').collect()))[0];
    const bytes = await t.run(async ctx => (await ctx.storage.get(record.storageId))!.arrayBuffer());
    expect((await sharp(Buffer.from(bytes)).metadata()).format).toBe('webp');
    expect(record.contentType).toBe('image/webp');
  });
  test('review: registration is closed by default and denies unapproved usernames', async () => {
    const t = setup(); vi.stubEnv('MECENAS_DEMO_USERNAMES', '');
    await expect(t.mutation(api.auth.signUpWithUsernamePassword, { username: 'not-invited', password: crypto.randomUUID() })).rejects.toThrow();
    vi.stubEnv('MECENAS_DEMO_USERNAMES', 'approved-demo');
    await expect(t.mutation(api.auth.signUpWithUsernamePassword, { username: 'not-invited', password: crypto.randomUUID() })).rejects.toThrow();
    expect(await t.run(ctx => ctx.db.query('users').collect())).toHaveLength(0);
  });
  test('T19 reference limits and concurrent own profile saves preserve constraints', async () => {
    const t = setup(); const { user, tokens } = await actor(t, 'demo-limits', 'client');
    const ids = await t.run(async ctx => { const storageId = await ctx.storage.store(new Blob(['synthetic'])); return Promise.all(Array.from({ length: 5 }, () => ctx.db.insert('uploads', { userId: tokens.userId as never, storageId, purpose: 'reference' as const, contentType: 'image/webp', size: 9 }))); });
    const id = await user.mutation(api.requests.saveDraft, { ...request, exampleUploadIds: ids.slice(0, 4) });
    await expect(user.mutation(api.requests.saveDraft, { ...request, id, exampleUploadIds: ids })).rejects.toThrow();
    await expect(user.mutation(api.requests.saveDraft, { ...request, id, exampleUploadIds: [ids[0], ids[0]] })).rejects.toThrow();
    expect((await user.query(api.requests.get, { id })).exampleUploadIds).toHaveLength(4);
    await Promise.all([user.mutation(api.profiles.save, profile('client', 'Primeiro Nome')), user.mutation(api.profiles.save, profile('client', 'Segundo Nome'))]);
    expect(await t.run(ctx => ctx.db.query('profiles').collect())).toHaveLength(1);
  });
  test('T20 malformed persisted storage links never publish', async () => {
    const t = setup(); const { user } = await actor(t, 'demo-corrupt', 'client'); const { user: artist } = await actor(t, 'demo-corrupt-view', 'artist');
    const id = await user.mutation(api.requests.saveDraft, request);
    await t.run(async ctx => { const foreign = await ctx.storage.store(new Blob(['private synthetic image'])); await ctx.db.patch(id, { exampleStorageIds: [foreign] }); });
    await expect(user.mutation(api.requests.publish, { id })).rejects.toThrow();
    expect(await artist.query(api.requests.browse, {})).toHaveLength(0);
    expect((await user.query(api.requests.get, { id })).status).toBe('draft');
  });
  test('T04 concurrent first profile saves cannot create duplicate identities', async () => {
    const t = setup(); vi.stubEnv('MECENAS_DEMO_USERNAMES', 'demo-concurrent');
    const signed = await t.mutation(api.auth.signUpWithUsernamePassword, { username: 'demo-concurrent', password: crypto.randomUUID() });
    if (signed.status !== 'complete') throw Error('Synthetic signup failed');
    const user = t.withIdentity(sessionIdentity(signed.tokens));
    await Promise.all([user.mutation(api.profiles.save, profile('artist', 'Artista Um')), user.mutation(api.profiles.save, profile('artist', 'Artista Dois'))]);
    expect(await t.run(ctx => ctx.db.query('profiles').collect())).toHaveLength(1);
  });
});
