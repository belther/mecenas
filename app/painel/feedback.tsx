import { ConvexError } from 'convex/values';

export function message(error: unknown) {
  if (error instanceof ConvexError) return String(error.data);
  if (error instanceof Error && !error.message.includes('[CONVEX')) return error.message;
  return 'Não foi possível concluir. Confira a conexão e tente novamente.';
}

export function Feedback({ error, success }: { error?: string; success?: string }) {
  return <>
    {error && <p className="feedback error" role="alert">{error}</p>}
    {success && <p className="feedback" role="status">{success}</p>}
  </>;
}
