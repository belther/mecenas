import { describe, test, expect } from 'vitest';
import { workspaceView } from '../lib/workspace-view';

describe('008 workspace view', () => {
  test('the configured reviewer sees only the review workspace, even with a client profile', () => {
    expect(workspaceView({ role: 'client' }, [])).toBe('reviewer');
    expect(workspaceView({ role: 'client' }, [{ id: 'case' }])).toBe('reviewer');
    expect(workspaceView(null, [])).toBe('reviewer');
  });
  test('other accounts keep their role workspace', () => {
    expect(workspaceView({ role: 'client' }, null)).toBe('client');
    expect(workspaceView({ role: 'artist' }, null)).toBe('artist');
    expect(workspaceView(null, null)).toBe('setup');
  });
  test('waits for both queries before choosing', () => {
    expect(workspaceView(undefined, null)).toBe('loading');
    expect(workspaceView({ role: 'client' }, undefined)).toBe('loading');
  });
});
