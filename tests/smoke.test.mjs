import test from 'node:test';
import assert from 'node:assert';
import * as scanner from '../scanner.js';
import * as normalizer from '../normalizer.js';
import * as reporter from '../reporter.js';

test('smoke test: modules exist and export expected functions', () => {
  assert.strictEqual(typeof scanner.runScan, 'function');
  assert.strictEqual(typeof normalizer.normalizeAxeResults, 'function');
  assert.strictEqual(typeof reporter.generateMarkdownReport, 'function');
});
