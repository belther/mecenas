'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import { DeliveryImage } from './deliveries';
import { Feedback, message } from './feedback';

type Case = NonNullable<FunctionReturnType<typeof api.disputes.queue>>[number];

export function ReviewerQueue({ cases }: { cases: Case[] }) {
  return <section className="reviewer-queue" aria-labelledby="reviewer-queue-title">
    <h2 id="reviewer-queue-title">Revisão da plataforma</h2>
    {cases.length ? cases.map(record => <ReviewCase key={record.id} record={record} />) : <p className="empty">Nenhuma contestação pendente.</p>}
  </section>;
}

function ReviewCase({ record }: { record: Case }) {
  const decide = useMutation(api.disputes.decide);
  const retry = useMutation(api.disputes.retryRefund);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const evidence = { offerId: record.offerId, version: record.version, caseId: record.id };
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      if (record.status === 'refundPending') {
        await retry({ caseId: record.id });
        setStatus('Verificação do reembolso solicitada.');
      } else {
        const outcome = fields.get('outcome');
        if (outcome !== 'uphold' && outcome !== 'dismiss') return;
        await decide({ caseId: record.id, outcome, note: String(fields.get('note') ?? '') });
      }
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  return <article className="request-card">
    <h3>{record.title} · versão {record.version}</h3>
    <p>Motivo informado: {record.reason}</p>
    {record.status === 'open' && <div className="delivery-images">
      <DeliveryImage {...evidence} kind="preview" label="Prévia contestada" />
      <div className="delivery-process">{Array.from({ length: record.processCount }, (_, index) =>
        <DeliveryImage key={index} {...evidence} kind="process" processIndex={index} label={`Processo ${index + 1}`} />)}</div>
    </div>}
    <form className="delivery-form" onSubmit={send}>
      {record.status === 'open' ? <>
        <label htmlFor={`decision-${record.id}`}>Decisão</label><select id={`decision-${record.id}`} name="outcome" defaultValue="" required><option value="" disabled>Escolha uma decisão</option>
          <option value="uphold">Acolher e solicitar reembolso integral</option>
          <option value="dismiss">Não acolher e simular repasse ao artista</option></select>
        <label>Justificativa<textarea name="note" required maxLength={1000} /></label>
        <button disabled={busy}>Registrar decisão</button>
      </> : <><p>Reembolso pendente. {record.decisionNote}</p><button disabled={busy}>Verificar reembolso</button></>}
    </form>
    <Feedback error={error} success={status} />
  </article>;
}
