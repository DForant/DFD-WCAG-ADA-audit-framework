import test from 'node:test';
import assert from 'node:assert';
import { normalizeAxeResults } from '../normalizer.js';

test('normalizer adheres to PRD Section 7.2 schema', () => {
  const raw = {
    url: 'https://example.com',
    timestamp: '2023-01-01T00:00:00.000Z',
    violations: []
  };
  const result = normalizeAxeResults(raw);
  
  assert.strictEqual(result.scanTarget, 'https://example.com');
  assert.strictEqual(typeof result.timestamp, 'string');
  assert.ok(result.summary);
  assert.strictEqual(typeof result.summary.critical, 'number');
  assert.strictEqual(typeof result.summary.serious, 'number');
  assert.strictEqual(typeof result.summary.moderate, 'number');
  assert.strictEqual(typeof result.summary.minor, 'number');
  assert.strictEqual(typeof result.summary.total, 'number');
  assert.ok(Array.isArray(result.violations));
});
