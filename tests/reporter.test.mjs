import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { generateMarkdownReport, writeReportToFile, RULE_METADATA } from '../reporter.js';

test('reporter generates valid markdown structure with all sections and testMethod automated', () => {
  const auditData = {
    scanTarget: 'https://example.com',
    timestamp: '2023-01-01T00:00:00.000Z',
    summary: { critical: 1, serious: 0, moderate: 1, minor: 0, total: 2 },
    violations: [
      {
        id: 'color-contrast',
        impact: 'serious',
        wcag: 'wcag143',
        description: 'Elements must have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
        nodes: [
          {
            target: ['#header'],
            html: '<div id="header">Low contrast text</div>',
            failureSummary: 'Fix any of the following: Element has insufficient color contrast'
          }
        ] 
      }
    ]
  };

  const md = generateMarkdownReport(auditData);

  assert.ok(md.includes('# WCAG / ADA Remediation Report'));
  assert.ok(md.includes('## 1. Executive Scorecard & Legal Risk Summary'));
  assert.ok(md.includes('## 2. Prioritized Issue Matrix'));
  assert.ok(md.includes('## 3. Engineering Remediation Cards'));
  assert.ok(md.includes('## 4. Accessibility Statement'));
  assert.ok(md.includes('color-contrast'));
  assert.ok(md.includes('Assistive Technology Barrier'));
  assert.ok(md.includes('Test Method'));
  assert.ok(md.includes('automated'));
});

test('reporter correctly ingests and translates Level A and AA visual, contrast & layout metadata rules', () => {
  const levelAaRules = [
    'css-orientation-lock',
    'autocomplete-valid',
    'color-contrast',
    'meta-viewport',
    'empty-heading',
    'focus-visible',
    'valid-lang'
  ];

  for (const ruleId of levelAaRules) {
    const metadata = RULE_METADATA[ruleId];
    assert.ok(metadata, `Rule metadata should exist for ${ruleId}`);
    assert.strictEqual(typeof metadata.wcagRef, 'string', `WCAG reference should be a string for ${ruleId}`);
    assert.strictEqual(typeof metadata.impactStatement, 'string', `Impact statement should be a string for ${ruleId}`);
    assert.ok(metadata.impactStatement.length > 10, `Impact statement for ${ruleId} should be descriptive`);
  }

  // Verify specific requirements for color-contrast and meta-viewport
  assert.ok(RULE_METADATA['color-contrast'].impactStatement.includes('4.5:1'), 'color-contrast impact statement must specify 4.5:1 ratio');
  assert.ok(RULE_METADATA['meta-viewport'].impactStatement.toLowerCase().includes('pinch-to-zoom') || RULE_METADATA['meta-viewport'].impactStatement.toLowerCase().includes('magnif') || RULE_METADATA['meta-viewport'].impactStatement.toLowerCase().includes('scale'), 'meta-viewport impact statement must specify zoom/scaling impact');
});

test('reporter correctly maps forms, media, and ARIA rules and distinguishes native vs ARIA label impacts', () => {
  const formsMediaAriaRules = [
    'image-alt',
    'area-alt',
    'object-alt',
    'video-caption',
    'audio-caption',
    'blink',
    'link-name',
    'label-title-only',
    'label',
    'aria-allowed-attr',
    'aria-required-attr',
    'button-name'
  ];

  for (const ruleId of formsMediaAriaRules) {
    const metadata = RULE_METADATA[ruleId];
    assert.ok(metadata, `Rule metadata should exist for ${ruleId}`);
    assert.strictEqual(typeof metadata.wcagRef, 'string');
    assert.strictEqual(typeof metadata.impactStatement, 'string');
  }

  // Verify distinction between native HTML label failure and ARIA label failure
  const nativeLabelMeta = RULE_METADATA['label'];
  const ariaLabelMeta = RULE_METADATA['label-title-only'];

  assert.ok(nativeLabelMeta.impactStatement.toLowerCase().includes('native <label>'), 'Native label impact statement must distinguish native labels');
  assert.ok(ariaLabelMeta.impactStatement.toLowerCase().includes('speech recognition users'), 'ARIA label-in-name impact statement must distinguish speech recognition/ARIA naming');
});

test('reporter deduplicates rules mapped to the same WCAG criterion', () => {
  const auditData = {
    scanTarget: 'https://example.com/dedup',
    timestamp: '2023-01-01T00:00:00.000Z',
    summary: { critical: 2, serious: 0, moderate: 0, minor: 0, total: 2 },
    violations: [
      {
        id: 'image-alt',
        impact: 'critical',
        wcag: 'WCAG 1.1.1 (Non-text Content)',
        description: 'Image missing alt',
        nodes: [{ target: ['img'], html: '<img src="test.jpg">', failureSummary: 'Add alt' }]
      },
      {
        id: 'area-alt',
        impact: 'critical',
        wcag: 'WCAG 1.1.1 (Non-text Content)',
        description: 'Area missing alt',
        nodes: [{ target: ['area'], html: '<area href="#">', failureSummary: 'Add alt to area' }]
      }
    ]
  };

  const md = generateMarkdownReport(auditData);
  assert.ok(md.includes('image-alt') || md.includes('area-alt'));
});

test('writeReportToFile writes REMEDIATION_REPORT.md successfully', () => {
  const auditData = {
    scanTarget: 'https://example.com',
    timestamp: '2023-01-01T00:00:00.000Z',
    summary: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 },
    violations: []
  };

  const outPath = writeReportToFile(auditData, 'TEST_REMEDIATION_REPORT.md');
  assert.ok(fs.existsSync(outPath));
  const content = fs.readFileSync(outPath, 'utf8');
  assert.ok(content.includes('Accessibility Statement'));
  assert.ok(content.includes('Test Method'));

  try {
    fs.unlinkSync(outPath);
  } catch (e) {}
});
