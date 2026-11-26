'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Feedback, message } from './feedback';
import { DeliveryPanel } from './deliveries';

const formatExpiry = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
});

export function ArtistPaymentStatus({ offerId }: { offerId: Id<'offers'> }) {
  const payment = useQuery(api.payments.view, { offerId });
  return <>{payment?.phase === 'funded'
    ? 'Pagamento de teste confirmado.'
    : 'Oferta aceita. Aguarde a confirmação do pagamento para começar.'}</>;
}

export function ClientPayment({ offerId }: { offerId: Id<'offers'> }) {
  const payment = useQuery(api.payments.view, { offerId });
  const start = useAction(api.pix.start);
  const refresh = useAction(api.pix.refresh);
  const [cpf, setCpf] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function run(operation: () => Promise<unknown>) {
    if (pending) return;
    setPending(true);
    setError('');
    setSuccess('');
    try {
      await operation();
    } catch (error) {
      setError(message(error));
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await start({ offerId, ...(cpf ? { syntheticCpf: cpf } : {}) });
      setCpf('');
    });
  }

  if (!payment) return <p role="status">Consultando pagamento…</p>;
  if (payment.phase === 'funded') return <>
    <p className="application-state" role="status">Pagamento de teste confirmado</p>
    <DeliveryPanel offerId={offerId} role="client" />
  </>;

  const canStart = payment.phase === 'awaitingPayment' || payment.phase === 'replaceable';
  const instructions = 'pixCode' in payment ? payment : null;
  return <div className="pix-payment">
    <p className="hint">Aguardando pagamento. Use apenas dados fictícios para o Pix de teste.</p>
    {payment.phase === 'checking' && <p role="status">Estamos verificando a cobrança existente. Aguarde antes de tentar outro Pix.</p>}
    {payment.phase === 'replaceable' && <p role="status">A cobrança anterior não está disponível. Você pode gerar outro Pix de teste.</p>}
    {canStart ? <form onSubmit={submit}>
      {'requiresCpf' in payment && payment.requiresCpf && <label>
        CPF fictício autorizado
        <input name="syntheticCpf" inputMode="numeric" autoComplete="off" maxLength={14}
          value={cpf} onChange={event => setCpf(event.target.value)} required disabled={pending} />
      </label>}
      <button type="submit" disabled={pending}>{pending ? 'Preparando Pix…' : 'Gerar Pix de teste'}</button>
    </form> : <>
      {instructions?.pixCode && instructions.qrImage && instructions.expiresAt !== undefined && <>
        <img src={instructions.qrImage} width={180} height={180} alt="Código QR do Pix de teste" />
        <p>Validade do Pix · {formatExpiry.format(instructions.expiresAt)} (Brasília)</p>
        <label>Código Pix copia e cola
          <textarea name="pixCode" rows={3} readOnly value={instructions.pixCode} />
        </label>
        <button className="secondary" type="button" onClick={async () => {
          setError(''); setSuccess('');
          try {
            await navigator.clipboard.writeText(instructions.pixCode!);
            setSuccess('Código Pix copiado.');
          } catch { setError('Selecione o código no campo acima para copiar.'); }
        }}>Copiar código Pix</button>
      </>}
      <button className="secondary" type="button" disabled={pending} onClick={() => run(() => refresh({ offerId }))}>
        {pending ? 'Verificando…' : 'Verificar pagamento'}
      </button>
    </>}
    <Feedback error={error} success={success} />
  </div>;
}
