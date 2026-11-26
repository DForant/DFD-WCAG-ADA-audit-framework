import test from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dictionary = require('../data/wcag-rule-dictionary.json');

test('dictionary schema and completeness', () => {
  const rules = Object.values(dictionary);
  assert.ok(rules.length >= 30, 'Should contain at least 30 rules');
  for (const rule of rules) {
    assert.ok(rule.wcagId, 'Rule missing wcagId');
    assert.ok(rule.severity, 'Rule missing severity');
    assert.ok(['critical', 'serious', 'moderate', 'minor'].includes(rule.severity), 'Invalid severity');
    assert.ok(['automated', 'hybrid', 'manual'].includes(rule.processType), 'Invalid processType');
    assert.ok(rule.compliantCodeExample, 'Rule missing code example');
  }
});