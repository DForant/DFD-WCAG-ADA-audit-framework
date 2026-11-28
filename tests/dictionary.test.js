import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictionaryPath = path.resolve(__dirname, '../data/wcag-rule-dictionary.json');

test('data/wcag-rule-dictionary.json parses as valid JSON and contains required keys', () => {
  assert.ok(fs.existsSync(dictionaryPath), 'wcag-rule-dictionary.json must exist');
  const raw = fs.readFileSync(dictionaryPath, 'utf8');
  const dict = JSON.parse(raw);
  assert.strictEqual(typeof dict, 'object');

  const expectedRules = [
    'dlitem', 'list', 'listitem', 'td-headers', 'heading-order', 'empty-heading', 'duplicate-id',
    'html-has-lang', 'html-lang-valid', 'valid-lang',
    'bypass', 'skip-link', 'document-title', 'focus-visible',
    'color-contrast', 'css-orientation-lock', 'meta-viewport', 'blink',
    'autocomplete-valid', 'label', 'label-title-only',
    'image-alt', 'area-alt', 'object-alt', 'video-caption', 'audio-caption',
    'aria-allowed-attr', 'aria-required-attr', 'button-name', 'link-name'
  ];

  for (const ruleId of expectedRules) {
    const entry = dict[ruleId];
    assert.ok(entry, `Rule ${ruleId} must exist in dictionary`);
    assert.strictEqual(typeof entry.wcagId, 'string');
    assert.strictEqual(typeof entry.wcagLevel, 'string');
    assert.strictEqual(typeof entry.category, 'string');
    assert.strictEqual(typeof entry.title, 'string');
    assert.strictEqual(typeof entry.plainDescription, 'string');
    assert.ok(entry.plainDescription.length > 5);
    assert.ok(['critical', 'serious', 'moderate', 'minor'].includes(entry.severity));
    assert.ok(['automated', 'hybrid', 'manual'].includes(entry.processType));
    assert.strictEqual(typeof entry.remediationSummary, 'string');
    assert.strictEqual(typeof entry.compliantCodeExample, 'string');
  }
});
