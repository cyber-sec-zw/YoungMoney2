import assert from 'node:assert/strict';
import test from 'node:test';
import { RESTORE_ORDER, WORKSPACE_TABLES } from './workspaceTables.ts';

test('backup export and restore manifests cover the same supported collections', () => {
  assert.deepEqual([...RESTORE_ORDER].sort(), [...WORKSPACE_TABLES].sort());
  assert.ok(WORKSPACE_TABLES.includes('market_sessions'));
  assert.ok(!WORKSPACE_TABLES.includes('market_events' as never));
});