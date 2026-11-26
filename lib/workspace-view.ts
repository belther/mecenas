// Decides which workspace /painel shows. The platform reviewer is recognised by
// the dispute queue: `api.disputes.queue` returns null for everyone else.
// The server keeps its own checks; this only chooses what the page renders.
export type WorkspaceView = 'loading' | 'reviewer' | 'setup' | 'artist' | 'client';

export function workspaceView(
  profile: { role: 'artist' | 'client' } | null | undefined,
  reviewerCases: readonly unknown[] | null | undefined,
): WorkspaceView {
  if (profile === undefined || reviewerCases === undefined) return 'loading';
  if (reviewerCases !== null) return 'reviewer';
  if (!profile) return 'setup';
  return profile.role;
}
