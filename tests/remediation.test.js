import test from 'node:test';
import assert from 'node:assert';
import { generateFixedSnippet } from '../utils/remediation.js';

test('generateFixedSnippet handles known baseline rules correctly', () => {
  const imgFix = generateFixedSnippet('image-alt', '<img src="test.jpg">');
  assert.ok(imgFix.includes('alt="Descriptive image context"'));

  const langFix = generateFixedSnippet('html-has-lang', '<html>');
  assert.ok(langFix.includes('lang="en"'));

  const titleFix = generateFixedSnippet('document-title', '<head></head>');
  assert.ok(titleFix.includes('<title>'));

  const headingFix = generateFixedSnippet('empty-heading', '<h1></h1>');
  assert.ok(headingFix.includes('Section Title'));

  const idFix = generateFixedSnippet('duplicate-id', '<div id="main">');
  assert.ok(idFix.includes('id="main-unique"'));
});

test('generateFixedSnippet falls back safely for unknown rule IDs', () => {
  const unknownFix = generateFixedSnippet('unknown-rule-id', '<div>Content</div>');
  assert.ok(typeof unknownFix === 'string');
  assert.ok(unknownFix.includes('data-wcag-fix'));
});

test('generateFixedSnippet handles edge-case inputs gracefully without throwing', () => {
  assert.strictEqual(typeof generateFixedSnippet('image-alt', ''), 'string');
  assert.strictEqual(typeof generateFixedSnippet('image-alt', null), 'string');
  assert.strictEqual(typeof generateFixedSnippet('image-alt', undefined), 'string');
  assert.strictEqual(typeof generateFixedSnippet('image-alt', '<img unclosed'), 'string');
});
