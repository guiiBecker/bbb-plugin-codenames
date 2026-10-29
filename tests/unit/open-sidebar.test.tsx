import {
  describe, expect, it, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOpenSidebarOnStart } from '../../src/components/main/hooks';

describe('useOpenSidebarOnStart', () => {
  it('opens the panel when a match starts, never on the first read', () => {
    const open = vi.fn();
    const { rerender } = renderHook(
      ({ matchId }: { matchId: string | null }) => useOpenSidebarOnStart(matchId, open),
      { initialProps: { matchId: 'running' as string | null } },
    );
    // Joining or reloading mid-match: the sidebar stays as the viewer left it.
    expect(open).not.toHaveBeenCalled();
    rerender({ matchId: null });
    expect(open).not.toHaveBeenCalled();
    rerender({ matchId: 'next' });
    expect(open).toHaveBeenCalledTimes(1);
    rerender({ matchId: 'next' });
    expect(open).toHaveBeenCalledTimes(1);
  });
});
