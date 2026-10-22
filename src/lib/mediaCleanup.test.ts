import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteOwnedMedia, type MediaCleanupAdapter } from './mediaCleanup.ts';

function adapter(overrides: Partial<MediaCleanupAdapter> = {}): MediaCleanupAdapter {
  return {
    listSupabasePage: async () => ({ paths: [], hasMore: false }),
    removeSupabase: async () => {},
    listR2Page: async () => ({ keys: [], truncated: false }),
    deleteR2: async () => {},
    ...overrides,
  };
}

test('deletes owned Supabase and R2 media across pages', async () => {
  const removedSupabase: string[] = [];
  const removedR2: string[] = [];
  const offsets: number[] = [];
  let r2Page = 0;
  await deleteOwnedMedia('owner-1', adapter({
    listSupabasePage: async (_owner, offset) => {
      offsets.push(offset);
      return offset === 0
        ? { paths: ['owner-1/a.png'], hasMore: true }
        : { paths: ['owner-1/b.wav'], hasMore: false };
    },
    removeSupabase: async paths => { removedSupabase.push(...paths); },
    listR2Page: async (_prefix, cursor) => {
      r2Page += 1;
      return cursor
        ? { keys: ['owner-1/legacy-b.png'], truncated: false }
        : { keys: ['owner-1/legacy-a.png'], truncated: true, cursor: 'next' };
    },
    deleteR2: async paths => { removedR2.push(...paths); },
  }));

  assert.deepEqual(offsets, [0, 1]);
  assert.deepEqual(removedSupabase, ['owner-1/a.png', 'owner-1/b.wav']);
  assert.deepEqual(removedR2, ['owner-1/legacy-a.png', 'owner-1/legacy-b.png']);
  assert.equal(r2Page, 2);
});

test('refuses to delete a path outside the target owner prefix', async () => {
  let deleted = false;
  await assert.rejects(() => deleteOwnedMedia('owner-1', adapter({
    listSupabasePage: async () => ({ paths: ['owner-2/private.png'], hasMore: false }),
    removeSupabase: async () => { deleted = true; },
  })), /outside the target account/);
  assert.equal(deleted, false);
});

test('stops if a paginated provider reports more results without progress', async () => {
  await assert.rejects(() => deleteOwnedMedia('owner-1', adapter({
    listSupabasePage: async () => ({ paths: [], hasMore: true }),
  })), /without returning any paths/);
});

test('rejects malformed owner IDs before listing media', async () => {
  let listed = false;
  await assert.rejects(() => deleteOwnedMedia('../owner', adapter({
    listSupabasePage: async () => { listed = true; return { paths: [], hasMore: false }; },
  })), /Invalid media owner ID/);
  assert.equal(listed, false);
});