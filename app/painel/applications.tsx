'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { formatBRL } from '../../lib/money';
import { Feedback, message } from './feedback';

type ApplicantId = Id<'applications'>;
type Review = FunctionReturnType<typeof api.applications.forRequest>;
type Request = FunctionReturnType<typeof api.requests.mine>[number];
type Application = FunctionReturnType<typeof api.applications.mine>[number];
type Offer = NonNullable<Application['offer']>;
type Selection = { revision: number; selected: ApplicantId[]; queue: ApplicantId[] };

const offerLabels: Record<Offer['status'], string> = {
  pending: 'Aguardando resposta',
  accepted: 'Oferta aceita · aguardando pagamento',
  declined: 'Oferta recusada',
};

export function ApplyButton({ requestId, applied }: { requestId: Id<'requests'>; applied: boolean }) {
  const apply = useMutation(api.applications.apply);
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const result = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (saved) result.current?.focus();
  }, [saved]);

  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    try {
      await apply({ requestId });
      setSaved(true);
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return <div className="application-actions">
    {applied || saved ? <p className="application-state" role="status" tabIndex={-1} ref={result}>Candidatura enviada</p> :
      <button type="button" disabled={pending} onClick={submit}>
        {pending ? 'Enviando candidatura…' : 'Candidatar-se'}
      </button>}
    <Feedback error={error} />
  </div>;
}

export function ArtistApplications({ applications }: { applications: Application[] | undefined }) {
  return <section aria-labelledby="my-applications">
    <h2 id="my-applications">Minhas candidaturas</h2>
    {applications === undefined ? <p role="status">Carregando candidaturas…</p> :
      applications.length === 0 ? <p className="hint">Suas candidaturas e ofertas aparecem aqui.</p> :
      <div className="application-list">
        {applications.map(application => <article className="request-card" key={application.id}>
          <h3>{application.title}</h3>
          <p className="price">{formatBRL(application.offer?.pricePerArtistCents ?? application.pricePerArtistCents)} <small>por artista</small></p>
          {application.offer ? <OfferActions offer={application.offer} /> :
            <p className="application-state">Candidatura enviada</p>}
        </article>)}
      </div>}
  </section>;
}

function OfferActions({ offer }: { offer: Offer }) {
  const respond = useMutation(api.applications.respond);
  const [pending, setPending] = useState<'accept' | 'decline' | null>(null);
  const [saved, setSaved] = useState<Offer['status'] | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const result = useRef<HTMLParagraphElement>(null);
  const decline = useRef<HTMLButtonElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  const status = offer.status === 'pending' && saved ? saved : offer.status;

  useEffect(() => {
    if (saved && status !== 'pending') result.current?.focus();
  }, [saved, status]);
  useEffect(() => {
    if (confirmDecline) stay.current?.focus();
  }, [confirmDecline]);

  async function answer(response: 'accept' | 'decline') {
    if (lock.current) return;
    lock.current = true;
    setPending(response);
    setError('');
    try {
      const outcome = await respond({ offerId: offer.id, response });
      setSaved(outcome.status);
      setConfirmDecline(false);
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setPending(null);
    }
  }

  return <div className="application-actions">
    <p className="application-state" role="status" tabIndex={-1} ref={result}>
      {status === 'accepted' ? 'Oferta aceita. Aguarde a confirmação do pagamento para começar.' :
        status === 'pending' ? 'Oferta recebida' : offerLabels.declined}
    </p>
    {status === 'pending' && <>
      <p>Aguarde a confirmação do pagamento para começar.</p>
      <div className="actions">
        <button type="button" disabled={pending !== null || confirmDecline} onClick={() => answer('accept')}>
          {pending === 'accept' ? 'Aceitando…' : 'Aceitar oferta'}
        </button>
        <button type="button" className="secondary" ref={decline} disabled={pending !== null}
          aria-expanded={confirmDecline} aria-controls={confirmDecline ? `decline-confirmation-${offer.id}` : undefined}
          onClick={() => setConfirmDecline(true)}>Recusar oferta</button>
      </div>
      {confirmDecline && <div className="offer-confirmation" id={`decline-confirmation-${offer.id}`}>
        <p>Ao recusar, a vaga passa para o próximo artista da fila, se houver. A decisão é definitiva.</p>
        <div className="actions">
          <button type="button" className="secondary" ref={stay} disabled={pending !== null}
            onClick={() => { setConfirmDecline(false); decline.current?.focus(); }}>Voltar à oferta</button>
          <button type="button" disabled={pending !== null} onClick={() => answer('decline')}>
            {pending === 'decline' ? 'Recusando…' : 'Confirmar recusa'}
          </button>
        </div>
      </div>}
    </>}
    <Feedback error={error} />
  </div>;
}

export function ClientApplicationReview({ request, dirty }: { request: Request; dirty: RefObject<boolean> }) {
  const review = useQuery(api.applications.forRequest, { requestId: request._id });
  return <section className="application-review" aria-labelledby="review-heading">
    <h2 id="review-heading">Candidaturas</h2>
    <p className="review-title">{request.title}</p>
    <p className="review-price">{formatBRL(request.pricePerArtistCents)} <small>por artista</small></p>
    {review === undefined ? <p role="status">Carregando candidaturas…</p> :
      <SelectionForm request={request} review={review} dirty={dirty} />}
  </section>;
}

function SelectionForm({ request, review, dirty }: { request: Request; review: Review; dirty: RefObject<boolean> }) {
  const [draft, setDraft] = useState<Selection | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rankUpdate, setRankUpdate] = useState('');
  const [savedRevision, setSavedRevision] = useState(0);
  const lock = useRef(false);
  const queueList = useRef<HTMLOListElement>(null);
  const select = useMutation(api.applications.select);
  const board = draft ?? { revision: review.revision, selected: [], queue: review.queue };
  const vacant = request.artistSlots - review.reserved;
  const blocked = pending || review.revision < savedRevision;
  const stale = !!draft && draft.revision !== review.revision;
  const closed = request.status === 'closed';
  const applicantById = new Map(review.applicants.map(applicant => [applicant.id, applicant]));
  const names = (id: ApplicantId) => applicantById.get(id)?.displayName ?? 'Candidatura indisponível';

  useEffect(() => {
    if (!draft) return;
    dirty.current = true;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); }
    window.addEventListener('beforeunload', warn);
    return () => {
      dirty.current = false;
      window.removeEventListener('beforeunload', warn);
    };
  }, [draft, dirty]);

  function update(next: Selection) {
    setDraft(next);
    setError('');
    setSuccess('');
  }

  function place(id: ApplicantId, destination: 'selected' | 'queue') {
    const selected = board.selected.filter(item => item !== id);
    const queue = board.queue.filter(item => item !== id);
    if (destination === 'selected') selected.push(id);
    else queue.push(id);
    update({ ...board, selected, queue });
  }

  function move(index: number, step: -1 | 1) {
    const queue = [...board.queue];
    const next = index + step;
    const id = queue[index];
    [queue[index], queue[next]] = [queue[next], id];
    update({ ...board, queue });
    setRankUpdate(`${names(id)} passou para a posição ${next + 1}.`);
    requestAnimationFrame(() => {
      const controls = Array.from(queueList.current?.children[next]?.querySelectorAll('button') ?? []);
      const target = controls[step === -1 ? 0 : 1];
      (target?.disabled ? controls.find(button => !button.disabled) : target)?.focus();
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !draft || blocked || stale || closed) return;
    if (board.queue.length && board.selected.length !== vacant) {
      setError('Selecione artistas para todas as vagas disponíveis ou retire os nomes da fila.');
      return;
    }
    lock.current = true;
    setPending(true);
    setError('');
    setSuccess('');
    try {
      const revision = await select({
        requestId: request._id,
        expectedRevision: board.revision,
        selectedApplicationIds: board.selected,
        backupApplicationIds: board.queue,
      });
      setSavedRevision(revision);
      setDraft(null);
      setSuccess(board.selected.length ? 'Ofertas enviadas. Seleção e fila salvas.' : 'Fila de reserva salva.');
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return <form className="selection-grid" onSubmit={save}>
    <section aria-labelledby="applicant-list">
      <h3 id="applicant-list">Artistas inscritos</h3>
      {review.applicants.length === 0 ? <p className="hint">As candidaturas aparecem aqui assim que os artistas se inscrevem.</p> :
        <ul className="applicant-list" role="list">{review.applicants.map(applicant => {
          const selected = board.selected.includes(applicant.id);
          const queued = board.queue.includes(applicant.id);
          const status = applicant.offer ? offerLabels[applicant.offer.status] :
            selected ? 'Para enviar oferta' : queued ? 'Na fila de reserva' : 'Candidatura recebida';
          return <li className="request-card" key={applicant.id}>
            <h4>{applicant.displayName}</h4>
            <p className="application-state">{status}</p>
            {applicant.offer?.status === 'accepted' && <p className="hint">O pagamento chega em uma etapa futura da demonstração.</p>}
            {applicant.bio && <p className="description">{applicant.bio}</p>}
            <div className="image-strip">{applicant.images.map((url, index) => url &&
              <img key={index} src={url} width={110} height={100} loading="lazy"
                alt={`Portfólio de ${applicant.displayName}, imagem ${index + 1}`} />)}</div>
            {!applicant.offer && !closed && <div className="actions application-actions">
              {!selected && <button type="button" className="secondary"
                aria-label={`Selecionar para oferta — ${applicant.displayName}`}
                disabled={blocked || stale || board.selected.length >= vacant}
                onClick={() => place(applicant.id, 'selected')}>Selecionar para oferta</button>}
              {!queued && <button type="button" className="secondary"
                aria-label={`Adicionar à fila — ${applicant.displayName}`}
                disabled={blocked || stale}
                onClick={() => place(applicant.id, 'queue')}>Adicionar à fila</button>}
            </div>}
          </li>;
        })}</ul>}
    </section>
    <section className="panel selection-summary" aria-labelledby="selection-heading">
      <h3 id="selection-heading">Seleção de artistas</h3>
      <p>{review.reserved} de {request.artistSlots} vagas reservadas · {vacant} disponíveis</p>
      {closed && <p className="application-state">Todas as ofertas foram aceitas. Candidaturas encerradas.</p>}
      <h4>Ofertas para enviar</h4>
      {board.selected.length ? <ul className="selection-list" role="list">{board.selected.map(id => <li key={id}>
        <span>{names(id)}</span>
        <button className="quiet" type="button" disabled={blocked || stale || closed}
          aria-label={`Retirar ${names(id)} da seleção`}
          onClick={() => update({ ...board, selected: board.selected.filter(item => item !== id) })}>Retirar</button>
      </li>)}</ul> : <p className="hint">Selecione artistas na lista de candidaturas.</p>}
      <h4>Fila de reserva</h4>
      <p className="hint">{closed ? 'A fila foi encerrada.' : 'Quando alguém recusa, a oferta segue para o primeiro artista da fila.'}</p>
      {board.queue.length ? <ol className="selection-list ranked-list" role="list" ref={queueList}>
        {board.queue.map((id, index) => <li key={id}><span><span className="queue-rank" aria-hidden="true">{index + 1}.</span> {names(id)}</span>
          {!closed && <div className="actions">
            <button className="quiet" type="button" aria-label={`Subir ${names(id)}`}
              disabled={blocked || stale || index === 0} onClick={() => move(index, -1)}>Subir</button>
            <button className="quiet" type="button" aria-label={`Descer ${names(id)}`}
              disabled={blocked || stale || index === board.queue.length - 1} onClick={() => move(index, 1)}>Descer</button>
            <button className="quiet" type="button" aria-label={`Retirar ${names(id)} da fila`}
              disabled={blocked || stale}
              onClick={() => update({ ...board, queue: board.queue.filter(item => item !== id) })}>Retirar</button>
          </div>}
        </li>)}
      </ol> : <p className="hint">A fila está vazia.</p>}
      <p className="visually-hidden" role="status">{rankUpdate}</p>
      {stale && <div>
        <p className="feedback error" role="alert">A seleção mudou. Confira as vagas e a fila antes de salvar.</p>
        <button className="secondary" type="button" disabled={blocked} onClick={() => {
          setDraft(null); setError(''); setRankUpdate('');
        }}>Carregar seleção atual</button>
      </div>}
      {draft && !closed && !stale && <div className="application-actions">
        {board.selected.length > 0 && <p>{board.selected.length} {board.selected.length === 1 ? 'oferta será enviada' : 'ofertas serão enviadas'} ao salvar.</p>}
        <button type="submit" disabled={blocked}>{blocked ? 'Salvando…' : 'Salvar seleção e fila'}</button>
      </div>}
      <Feedback error={stale ? '' : error} success={success} />
    </section>
  </form>;
}
