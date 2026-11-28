/**
 * reporter.js - Markdown remediation report compiler
 * Implements FR-REPORT-01 through FR-REPORT-03 & Level A/Form/Media/ARIA Metadata Mapping
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
  console.warn('[reporter] Failed to load wcag-rule-dictionary.json:', err.message);
}

/**
 * Comprehensive rule metadata mapping loaded from external dictionary with backwards-compatible aliases.
 */
export const RULE_METADATA = new Proxy(rawDictionary, {
  get(target, prop) {
    if (prop in target) {
      const entry = target[prop];
      return {
        ...entry,
        wcagRef: `WCAG ${entry.wcagId} (${entry.title})`,
        impactStatement: entry.plainDescription
      };
    }
    return {
      wcagId: '2.1',
      wcagLevel: 'AA',
      category: 'General',
      title: prop,
      plainDescription: 'Accessibility barrier detected that requires remediation.',
      severity: 'moderate',
      processType: 'automated',
      remediationSummary: 'Review code and ensure WCAG compliance.',
      compliantCodeExample: '<!-- Remediation example unavailable -->',
      wcagRef: 'WCAG 2.1 AA',
      impactStatement: 'Users relying on assistive technologies may experience barriers interacting with this element.'
    };
  }
});

export function generateMarkdownReport(auditData = {}) {
  const target = auditData.scanTarget || auditData.url || 'Unknown Target';
  const timestamp = auditData.timestamp || new Date().toISOString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const rawViolations = auditData.violations || [];

  const violationsMap = new Map();
  for (const v of rawViolations) {
    const id = v.id || v.ruleId || 'unknown';
    const meta = RULE_METADATA[id] || {};
    const wcagRef = v.wcag || meta.wcagRef || 'WCAG 2.1 AA';
    const dedupKey = `${wcagRef}-${id}`;

    const normalizedNodes = (Array.isArray(v.nodes) ? v.nodes : []).map(n => ({
      ...n,
      target: Array.isArray(n.target) ? n.target.join(' ') : (n.target || n.selector || ''),
      html: n.html || n.originalHtml || ''
    }));

    if (violationsMap.has(dedupKey)) {
      const existing = violationsMap.get(dedupKey);
      const existingNodeKeys = new Set(existing.nodes.map(n => `${n.target}|${n.html}`));
      for (const node of normalizedNodes) {
        const nodeKey = `${node.target}|${node.html}`;
        if (!existingNodeKeys.has(nodeKey)) {
          existingNodeKeys.add(nodeKey);
          existing.nodes.push(node);
        }
      }
    } else {
      violationsMap.set(dedupKey, {
        ...v,
        id,
        impact: v.impact || v.severity || meta.severity || 'moderate',
        description: v.description || v.plainDescription || meta.plainDescription || 'N/A',
        wcag: wcagRef,
        nodes: normalizedNodes
      });
    }
  }  
  const violations = Array.from(violationsMap.values());

  let md = '# WCAG / ADA Remediation Report\n\n';
  md += '**Target URL:** ' + target + '  \n';
  md += '**Audit Timestamp:** ' + timestamp + '  \n';
  md += '**Test Method:** automated  \n\n';

  md += '## 1. Executive Scorecard & Legal Risk Summary\n\n';
  md += 'This report provides an accessibility compliance audit against WCAG 2.1 Level AA standards and ADA requirements using automated testing methodology. Detected barriers present potential legal exposure and restrict access for users relying on assistive technologies.\n\n';
  md += '- **Critical Violations:** ' + summary.critical + '\n';
  md += '- **Serious Violations:** ' + summary.serious + '\n';
  md += '- **Moderate Violations:** ' + summary.moderate + '\n';
  md += '- **Minor Violations:** ' + summary.minor + '\n';
  md += '- **Total Issues Detected:** ' + summary.total + '\n\n';

  md += '## 2. Prioritized Issue Matrix\n\n';
  md += '| Severity | Rule ID | WCAG Ref | Test Method | Description |\n';
  md += '| :--- | :--- | :--- | :--- | :--- |\n';

  if (violations.length === 0) {
    md += '| NONE | -- | -- | automated | No accessibility violations detected. |\n';
  } else {
    for (const v of violations) {
      const impact = (v.impact || 'moderate').toUpperCase();
      const id = v.id || 'unknown';
      const meta = RULE_METADATA[id] || {};
      const wcagRef = v.wcag || meta.wcagRef || 'WCAG 2.1 AA';
      const desc = (v.description || 'N/A').replace(/\|/g, '\\|');
      md += '| **' + impact + '** | `' + id + '` | ' + wcagRef + ' | automated | ' + desc + ' |\n';
    }
  }
  md += '\n';

  md += '## 3. Engineering Remediation Cards\n\n';
  if (violations.length === 0) {
    md += '_No accessibility violations detected._\n\n';
  } else {
    violations.forEach((v, index) => {
      const impact = (v.impact || 'MODERATE').toUpperCase();
      const meta = RULE_METADATA[v.id] || {};
      const wcagCriterion = v.wcag || meta.wcagRef || 'WCAG 2.1 Level AA';
      const impactStatement = meta.impactStatement || 'Users relying on screen readers, keyboard navigation, or magnification may experience failure to perceive or interact with this component.';

      md += '### ' + (index + 1) + '. [' + impact + '] ' + v.id + '\n\n';
      md += '- **WCAG Criterion:** ' + wcagCriterion + '\n';
      md += '- **Test Method:** automated\n';
      md += '- **Assistive Technology Barrier:** ' + impactStatement + '\n';
      md += '- **Rule URL:** ' + (v.helpUrl || 'N/A') + '\n\n';

      if (v.nodes && v.nodes.length > 0) {
        md += '#### Current Problematic HTML:\n\n';
        v.nodes.slice(0, 3).forEach((n) => {
          md += '```html\n' + (n.html || '<!-- Node snippet unavailable -->') + '\n```\n\n';
          if (n.failureSummary) {
            md += '**Failure Summary:** ' + n.failureSummary + '\n\n';
          }
        });

        md += '#### Recommended Remediation:\n\n';
        const problemHtml = v.nodes[0].html || '<!-- Node snippet unavailable -->';
        const fixedHtml = v.nodes[0].fixedSnippet || generateFixedSnippet(v.id, problemHtml);
        md += '```html\n' + fixedHtml + '\n```\n\n';
      }
    });
  }

  md += '## 4. Accessibility Statement\n\n';
  md += 'This organization is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards, conforming to WCAG 2.1 Level AA guidelines.\n\n';
  md += '### Feedback & Contact\n';
  md += 'We welcome your feedback on the accessibility of this property. Please let us know if you encounter accessibility barriers by contacting our support team.\n\n';

  return md;
}

export function writeReportToFile(auditData, outputPath = 'REMEDIATION_REPORT.md') {
  const markdown = generateMarkdownReport(auditData);
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  fs.writeFileSync(resolvedPath, markdown, 'utf8');
  return resolvedPath;
}

export default { RULE_METADATA, generateMarkdownReport, writeReportToFile, generateFixedSnippet };
