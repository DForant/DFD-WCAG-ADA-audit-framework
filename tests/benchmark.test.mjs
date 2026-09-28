import test from 'node:test';
import assert from 'node:assert';
import { normalizeAxeResults } from '../normalizer.js';

test('benchmark target json configuration exists and normalizes properly', () => {
  const rawSample = {
    url: 'https://deanforantdesigns.com',
    timestamp: new Date().toISOString(),
    violations: [
      {
        id: 'color-contrast',
        impact: 'serious',
        tags: ['wcag2aa'],
        description: 'Ensure contrast is sufficient',
        nodes: [
          {
            target: ['p'],
            html: '<p style="color: #ccc;">Low contrast</p>',
            failureSummary: 'Fix contrast'
          }
        ]
      }
    ]
  };

  const normalized = normalizeAxeResults(rawSample);
  assert.strictEqual(normalized.scanTarget, 'https://deanforantdesigns.com');
  assert.strictEqual(normalized.summary.serious, 1);
  assert.strictEqual(normalized.violations.length, 1);
});
