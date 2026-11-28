/**
 * normalizer.js - Normalizes raw axe scan results
 * Implements normalization, rule dictionary merging, and remediation snippet attachment.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFixedSnippet } from './utils/remediation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictionaryPath = path.resolve(__dirname, 'data/wcag-rule-dictionary.json');

let rawDictionary = {};
try {
  if (fs.existsSync(dictionaryPath)) {
    rawDictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  }
} catch (err) {
  console.warn('[normalizer] Failed to load wcag-rule-dictionary.json:', err.message);
}

export const RULE_METADATA = rawDictionary;

export function normalizeAxeResults(raw) {
  const violations = raw.violations || [];
  const summary = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: 0
  };

  for (const v of violations) {
    const impact = (v.impact || 'moderate').toLowerCase();
    if (impact === 'critical') summary.critical++;
    else if (impact === 'serious') summary.serious++;
    else if (impact === 'moderate') summary.moderate++;
    else if (impact === 'minor') summary.minor++;
    summary.total++;
  }

  return {
    scanTarget: raw.url || raw.scanTarget || 'Unknown Target',
    timestamp: raw.timestamp || new Date().toISOString(),
    summary,
    violations: violations.map(v => {
      const meta = RULE_METADATA[v.id] || {
        wcagId: '2.1',
        wcagLevel: 'AA',
        category: 'General',
        title: v.id,
        plainDescription: v.description || 'Accessibility barrier detected.',
        severity: v.impact || 'moderate',
        processType: 'automated',
        remediationSummary: 'Review and fix element markup.',
        compliantCodeExample: '<!-- Example unavailable -->'
      };

      const nodes = (v.nodes || []).map(node => {
        const selector = Array.isArray(node.target) ? node.target.join(' ') : (node.target || '');
        const originalHtml = node.html || '';
        const fixedSnippet = generateFixedSnippet(v.id, originalHtml);
        return {
          selector,
          originalHtml,
          fixedSnippet,
          failureSummary: node.failureSummary || ''
        };
      });

      return {
        ruleId: v.id,
        wcagId: meta.wcagId,
        wcagLevel: meta.wcagLevel,
        severity: v.impact || meta.severity || 'moderate',
        plainDescription: meta.plainDescription || v.description,
        remediationSummary: meta.remediationSummary,
        helpUrl: v.helpUrl || '',
        nodes
      };
    })
  };
}

export function normalizeResults(rawAxeOutput) {
  return normalizeAxeResults(rawAxeOutput);
}

export default { normalizeAxeResults, normalizeResults, RULE_METADATA };
