const brasilia = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
});

export function formatDeadline(instant: number) {
  return `${brasilia.format(instant)} (horário de Brasília)`;
}
