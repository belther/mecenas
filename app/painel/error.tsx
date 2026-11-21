'use client';
export default function PanelError({ reset }: { reset: () => void }) {
  return <main className="workspace"><h1>O ateliê não respondeu.</h1><p role="alert">Não foi possível carregar os dados. Confira a conexão e tente novamente.</p><button onClick={reset}>Tentar novamente</button></main>;
}
