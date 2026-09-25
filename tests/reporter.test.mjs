import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { generateMarkdownReport, writeReportToFile } from '../reporter.js';

test('reporter generates valid markdown structure with all sections', () => {
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

  // Cleanup
  try {
    fs.unlinkSync(outPath);
  } catch (e) {}
});
