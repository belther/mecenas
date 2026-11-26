'use client';

import { useAction, useMutation, useQuery } from 'convex/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { formatDeadline } from '../../lib/deadline';
import { formatBRL } from '../../lib/money';
import { Feedback, message } from './feedback';

type Offer = { offerId: Id<'offers'> };
type Version = Offer & { version: number };
type Delivery = FunctionReturnType<typeof api.deliveries.mine>;
const imageTypes = 'image/jpeg,image/png,image/webp';

export function DeliveryPanel({ offerId, role }: Offer & { role: 'artist' | 'client' }) {
  const delivery = useQuery(api.deliveries.mine, { offerId });
  if (!delivery || delivery.phase === 'awaitingPayment') return null;
  const version = { offerId, version: delivery.version };
  const needsFiles = delivery.phase === 'ready' || delivery.phase === 'revision';

  return <section className="delivery-panel" aria-label="Entrega da ilustração">
    <h4>{delivery.version ? `Entrega · versão ${delivery.version}` : 'Entrega da ilustração'}</h4>
    {delivery.phase === 'ready' && role === 'client' && <p role="status">Aguardando a primeira entrega.</p>}
    {delivery.phase === 'review' && role === 'artist' && <p role="status">Aguardando a avaliação do cliente.</p>}
    {delivery.phase === 'review' && delivery.reviewBy !== undefined && <p>
      Avaliação até {formatDeadline(delivery.reviewBy)}. Sem resposta, a entrega será aprovada e o repasse será simulado automaticamente.
    </p>}
    {delivery.phase === 'revision' && <p role="status">{role === 'artist' ? 'O cliente solicitou ajustes.' : 'Aguardando a versão revisada.'}</p>}
    {delivery.revisions.length > 0 && <ul className="delivery-notes" aria-label="Histórico de revisões">
      {delivery.revisions.map(revision => <li key={revision.version}>
        <strong>Revisão da versão {revision.version}</strong>
        <p>{revision.note}</p>
      </li>)}
    </ul>}
    {delivery.dispute && <div className="panel">
      <p role="status"><strong>{{ open: 'Contestação em análise pela plataforma.', dismissed: 'Contestação não acolhida.',
        refundPending: 'Contestação acolhida. Reembolso pendente.', refunded: 'Reembolso de teste confirmado.' }[delivery.dispute.status]}</strong></p>
      <p>Motivo informado: {delivery.dispute.reason}</p>
      {delivery.dispute.decisionNote && <p>Decisão da plataforma: {delivery.dispute.decisionNote}</p>}
    </div>}
    {delivery.phase === 'rejected' && role === 'artist' && <DeliveryDownloads {...version} />}
    {delivery.version > 0 && !(delivery.phase === 'rejected' && role === 'client') && <div className="delivery-images" key={`images-${delivery.version}`}>
      <DeliveryImage {...version} kind="preview" label="Prévia com marca d’água" />
      <div className="delivery-process">
        {Array.from({ length: delivery.processCount }, (_, index) => <DeliveryImage key={index}
          {...version} kind="process" processIndex={index} label={`Processo ${index + 1}`} />)}
      </div>
    </div>}
    {role === 'artist' && needsFiles && <DeliveryForm key={`form-${delivery.version}`} {...version} licence={delivery.licence} />}
    {role === 'client' && delivery.phase === 'review' && <DeliveryReview key={`review-${delivery.version}`} {...version} delivery={delivery} />}
    {role === 'client' && delivery.phase === 'review' && <FlagForm key={delivery.version} {...version} />}
    {delivery.release && <div className="delivery-release">
      <p className="application-state" role="status">
        {delivery.release.reason === 'deadline' ? 'Entrega aprovada automaticamente ao fim do prazo.' : delivery.release.reason === 'dismissed' ? 'Entrega aprovada pela plataforma.' : 'Entrega aprovada pelo cliente.'} {formatBRL(delivery.release.amountCents)} · repasse simulado.
      </p>
      {role === 'client' && <DeliveryDownloads {...version} licence={delivery.release.licence} />}
    </div>}
  </section>;
}

export function DeliveryImage({ offerId, version, kind, processIndex, label, caseId }: Version & {
  kind: 'preview' | 'process'; processIndex?: number; label: string; caseId?: Id<'disputes'>;
}) {
  const read = useAction(api.deliveryFiles.read);
  const [image, setImage] = useState<{ url: string } | 'error' | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let url: string | undefined;
    void read({ offerId, version, kind, processIndex, caseId }).then(file => {
      if (!active) return;
      url = URL.createObjectURL(new Blob([file.bytes], { type: file.contentType }));
      setImage({ url });
    }).catch(() => { if (active) setImage('error'); });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [read, offerId, version, kind, processIndex, caseId, retry]);

  return <figure className={`delivery-image delivery-image-${kind}`}>
    {image === 'error' ? <button type="button" className="secondary" onClick={() => {
      setImage(null);
      setRetry(attempt => attempt + 1);
    }}>Recarregar {label.toLowerCase()}</button> : image ?
      <img src={image.url} alt={label} /> : <p role="status">Carregando imagem…</p>}
    <figcaption>{label}</figcaption>
  </figure>;
}

function DeliveryForm({ offerId, version, licence }: Version & { licence: string }) {
  const upload = useAction(api.deliveryFiles.upload);
  const submit = useMutation(api.deliveries.submit);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const fields = new FormData(event.currentTarget);
    const original = fields.get('original');
    const process = fields.getAll('process').filter((file): file is File => file instanceof File && file.size > 0);
    if (!(original instanceof File) || !original.size || process.length < 2 || process.length > 3) {
      setError('Escolha o arquivo final e duas ou três imagens do processo.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    const draft = { offerId, expectedVersion: version };
    async function stage(file: File, kind: 'original' | 'process') {
      return upload({ ...draft, kind, bytes: await file.arrayBuffer(), contentType: file.type });
    }
    try {
      const originalId = await stage(original, 'original');
      const processIds = [];
      for (const image of process) processIds.push(await stage(image, 'process'));
      await submit({ ...draft, originalId, processIds });
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <form className="delivery-form" onSubmit={send}>
    <label>Arquivo final<input name="original" type="file" accept={imageTypes} required disabled={busy} /></label>
    <label>Imagens do processo (2 ou 3)<input name="process" type="file" accept={imageTypes} multiple required disabled={busy} /></label>
    <p className="hint">JPEG, PNG ou WebP de até 5 MB por arquivo.</p>
    <p className="delivery-licence">{licence}</p>
    <button type="submit" disabled={busy}>{busy ? 'Enviando arquivos…' : version ? 'Enviar versão revisada' : 'Enviar entrega'}</button>
    <Feedback error={error} />
  </form>;
}

function DeliveryReview({ offerId, version, delivery }: Version & { delivery: Delivery }) {
  const approve = useMutation(api.deliveries.approve);
  const requestRevision = useMutation(api.deliveries.requestRevision);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [revising, setRevising] = useState(false);
  const [error, setError] = useState('');
  const args = { offerId, version };

  async function review(operation: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try { await operation(); }
    catch (error) { setError(message(error)); }
    finally { lock.current = false; setBusy(false); }
  }

  function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get('note') ?? '');
    void review(() => requestRevision({ ...args, note }));
  }

  return <div className="delivery-review">
    <p className="delivery-licence">{delivery.licence}</p>
    <p className="hint">{delivery.revisions.length} de 2 revisões solicitadas.</p>
    {revising ? <form onSubmit={revise}>
      <label>O que você quer ajustar?<textarea name="note" rows={3} maxLength={1000} autoFocus required /></label>
      <div className="actions">
        <button type="submit" disabled={busy}>Enviar pedido de revisão</button>
        <button type="button" className="quiet" onClick={() => setRevising(false)} disabled={busy}>Cancelar</button>
      </div>
    </form> : <div className="actions">
      <button type="button" disabled={busy} onClick={() => review(() => approve(args))}>Aprovar e simular repasse</button>
      {delivery.revisions.length < 2 && <button type="button" className="secondary"
        disabled={busy} onClick={() => { setError(''); setRevising(true); }}>Solicitar revisão</button>}
    </div>}
    <Feedback error={error} />
  </div>;
}

function FlagForm({ offerId, version }: Version) {
  const flag = useMutation(api.disputes.flag);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '');
    setBusy(true);
    setError('');
    try { await flag({ offerId, version, reason }); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  if (!open) return <button type="button" className="quiet" onClick={() => setOpen(true)}>Contestar uso de IA</button>;
  return <form className="delivery-form" onSubmit={send}>
    <label>Por que você suspeita de uso de IA?<textarea name="reason" required maxLength={1000} autoFocus /></label>
    <p>A plataforma examinará esta versão. O prazo e o repasse ficam suspensos durante a análise.</p>
    <div className="actions"><button disabled={busy}>Enviar contestação</button>
      <button type="button" className="quiet" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button></div>
    <Feedback error={error} />
  </form>;
}

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function download(name: string, file: Blob) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DeliveryDownloads({ offerId, version, licence }: Version & { licence?: string }) {
  const read = useAction(api.deliveryFiles.read);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function original() {
    setBusy(true);
    setError('');
    try {
      const file = await read({ offerId, version, kind: 'original' });
      download(`mecenas-ilustracao-v${version}.${extensions[file.contentType]}`, new Blob([file.bytes], { type: file.contentType }));
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }

  return <>
    <p className="delivery-licence">{licence}</p>
    <div className="actions">
      <button type="button" disabled={busy} onClick={original}>{busy ? 'Preparando arquivo…' : 'Baixar ilustração'}</button>
      {licence && <button type="button" className="secondary" onClick={() => download(
        `mecenas-licenca-v${version}.txt`, new Blob([`Mecenas — licença de uso pessoal\n\n${licence}\n`], { type: 'text/plain;charset=utf-8' }),
      )}>Baixar licença</button>}
    </div>
    <Feedback error={error} />
  </>;
}
