// Iteration 009: one plain stage per client commission, shown as a chip on the client's list.
export type Stage = 'pendingOffer' | 'awaitingPayment' | 'inProgress' | 'review' | 'revision'
  | 'approved' | 'disputed' | 'refundPending' | 'refunded';

export type OfferFacts = {
  offer: 'pending' | 'accepted';
  funded: boolean;
  delivery?: 'review' | 'revision' | 'approved' | 'disputed' | 'rejected';
  dispute?: 'open' | 'dismissed' | 'refundPending' | 'refunded';
};

export function offerStage(f: OfferFacts): Stage {
  if (f.offer === 'pending') return 'pendingOffer';
  if (!f.funded) return 'awaitingPayment';
  if (f.dispute === 'refunded') return 'refunded';
  if (f.dispute === 'refundPending') return 'refundPending';
  if (f.dispute === 'open') return 'disputed';
  if (f.dispute === 'dismissed' || f.delivery === 'approved') return 'approved';
  if (!f.delivery) return 'inProgress';
  if (f.delivery === 'review') return 'review';
  if (f.delivery === 'revision') return 'revision';
  return 'disputed';
}

/** With several artists, the stage that needs the client first wins. A finished offer
 * (approved, refunded) shows only when no other offer is still in progress. */
const PRIORITY: Stage[] = ['review', 'awaitingPayment', 'disputed', 'refundPending', 'revision',
  'inProgress', 'pendingOffer', 'approved', 'refunded'];

export function requestStage(offers: OfferFacts[]): Stage | undefined {
  return offers.map(offerStage).sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0];
}

export const STAGE_LABEL: Record<Stage, string> = {
  pendingOffer: 'Oferta enviada', awaitingPayment: 'Aguardando Pix', inProgress: 'Em produção',
  review: 'Entrega para avaliar', revision: 'Revisão pedida', approved: 'Aprovada',
  disputed: 'Em revisão da plataforma', refundPending: 'Reembolso pendente', refunded: 'Reembolsada',
};

/** Stages where the client has to act. */
export const CLIENT_ACTION: ReadonlySet<Stage> = new Set(['review', 'awaitingPayment']);
