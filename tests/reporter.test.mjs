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

test('reporter correctly ingests and translates Level A DOM & semantic metadata rules', () => {
  const levelARules = [
    'dlitem',
    'list',
    'listitem',
    'td-headers',
    'bypass',
    'skip-link',
    'document-title',
    'html-has-lang',
    'html-lang-valid',
    'duplicate-id'
  ];

  for (const ruleId of levelARules) {
    const metadata = RULE_METADATA[ruleId];
    assert.ok(metadata, `Rule metadata should exist for ${ruleId}`);
    assert.strictEqual(typeof metadata.wcagRef, 'string', `WCAG reference should be a string for ${ruleId}`);
    assert.strictEqual(typeof metadata.impactStatement, 'string', `Impact statement should be a string for ${ruleId}`);
    assert.ok(metadata.impactStatement.length > 10, `Impact statement for ${ruleId} should be descriptive`);
  }

  const auditData = {
    scanTarget: 'https://example.com/semantic',
    timestamp: '2023-01-01T00:00:00.000Z',
    summary: { critical: 2, serious: 1, moderate: 0, minor: 0, total: 3 },
    violations: levelARules.map(id => ({
      id,
      impact: 'critical',
      description: `Violation description for ${id}`,
      nodes: [
        {
          target: ['body'],
          html: `<div data-test="${id}">Bad Markup</div>`,
          failureSummary: 'Fix the markup structure'
        }
      ]
    }))
  };

  const md = generateMarkdownReport(auditData);

  for (const ruleId of levelARules) {
    assert.ok(md.includes(ruleId), `Markdown report should include rule id ${ruleId}`);
  }
  assert.ok(md.includes('automated'), 'Markdown report should include automated test method');
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

  // Cleanup
  try {
    fs.unlinkSync(outPath);
  } catch (e) {}
});
