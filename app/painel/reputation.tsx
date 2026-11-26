'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

function rate(part: number, total: number) {
  if (!total) return 'Sem histórico (0 de 0)';
  const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(part / total);
  return `${percent} (${part} de ${total})`;
}

type Subject = { profileId: Id<'profiles'> } | { applicationId: Id<'applications'> } | { requestId: Id<'requests'> };

export function Reputation(subject: Subject) {
  const facts = useQuery(api.reputation.facts, { subject });
  if (!facts) return null;
  return <details className="reputation"><summary>Histórico de {facts.role === 'artist' ? 'artista' : 'cliente'}</summary>
    {facts.role === 'artist' ? <ul>
      <li>Encomendas concluídas: {facts.completed}</li><li>Contestações acolhidas: {facts.upheld}</li>
      <li>Pontualidade: Sem prazo de entrega registrado</li>
    </ul> : <ul>
      <li>Encomendas pagas: {facts.paid}</li>
      <li>Entregas com pedido de revisão: {rate(facts.revised, facts.delivered)}</li>
      <li>Entregas rejeitadas: {rate(facts.upheld, facts.delivered)}</li>
      <li>Contestações abertas pelo cliente: {facts.flagged} · acolhidas: {facts.upheld} · não acolhidas: {facts.dismissed}</li>
    </ul>}
  </details>;
}
