import { describe, expect, test } from 'vitest';
import { CLIENT_ACTION, offerStage, requestStage, STAGE_LABEL } from '../lib/commission-stage';
import { pixConfigured } from '../lib/pix-config';

describe('commission stage (iteration 009)', () => {
  test('each offer maps to one stage, disputes first after payment', () => {
    expect(offerStage({ offer: 'pending', funded: false })).toBe('pendingOffer');
    expect(offerStage({ offer: 'accepted', funded: false })).toBe('awaitingPayment');
    expect(offerStage({ offer: 'accepted', funded: true })).toBe('inProgress');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'review' })).toBe('review');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'revision' })).toBe('revision');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'approved' })).toBe('approved');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'disputed', dispute: 'open' })).toBe('disputed');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'disputed', dispute: 'dismissed' })).toBe('approved');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'rejected', dispute: 'refundPending' })).toBe('refundPending');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'rejected', dispute: 'refunded' })).toBe('refunded');
  });

  test('with several artists the stage that needs the client wins; no offers means no stage', () => {
    expect(requestStage([])).toBeUndefined();
    expect(requestStage([
      { offer: 'accepted', funded: true, delivery: 'approved' },
      { offer: 'accepted', funded: true, delivery: 'review' },
      { offer: 'pending', funded: false },
    ])).toBe('review');
    expect(requestStage([{ offer: 'accepted', funded: true, delivery: 'approved' },
      { offer: 'accepted', funded: true, delivery: 'rejected', dispute: 'refunded' }])).toBe('approved');
    expect(offerStage({ offer: 'accepted', funded: true, delivery: 'rejected' })).toBe('disputed');
    expect(CLIENT_ACTION.has('review') && CLIENT_ACTION.has('awaitingPayment') && !CLIENT_ACTION.has('approved')).toBe(true);
    expect(Object.keys(STAGE_LABEL)).toHaveLength(9);
  });

  test('Pix counts as configured only with every sandbox setting', () => {
    const full = { ABACATEPAY_TEST_MODE: 'true', ABACATEPAY_API_KEY: 'abc_dev_x', ABACATEPAY_WEBHOOK_SECRET: 's',
      MECENAS_CPF_HASH_SECRET: 'x'.repeat(32), MECENAS_SYNTHETIC_CPF_HASHES: 'h' };
    expect(pixConfigured(full)).toBe(true);
    expect(pixConfigured({})).toBe(false);
    expect(pixConfigured({ ...full, ABACATEPAY_API_KEY: 'abc_prod_x' })).toBe(false);
    expect(pixConfigured({ ...full, ABACATEPAY_TEST_MODE: 'false' })).toBe(false);
    for (const key of Object.keys(full)) expect(pixConfigured({ ...full, [key]: undefined })).toBe(false);
  });
});
