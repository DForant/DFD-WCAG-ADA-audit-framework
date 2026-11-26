import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const RULE_DATA = require('./data/wcag-rule-dictionary.json');

export const RULE_METADATA = {};
for (const [id, data] of Object.entries(RULE_DATA)) {
  RULE_METADATA[id] = {
    wcagRef: `WCAG ${data.wcagId} (${data.title})`,
    impactStatement: data.plainDescription
  };
}

function generateFixedSnippet(ruleId, originalHtml = '') {
  if (!originalHtml) return '<!-- Corrected markup unavailable -->';
  if (RULE_DATA[ruleId] && RULE_DATA[ruleId].compliantCodeExample) {
      return RULE_DATA[ruleId].compliantCodeExample;
  }
  return originalHtml.replace(/>/, ' data-wcag-fix="' + ruleId + '">');
}

export function generateMarkdownReport(auditData = {}) {
  const target = auditData.scanTarget || auditData.url || 'Unknown Target';
  const timestamp = auditData.timestamp || new Date().toISOString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const rawViolations = auditData.violations || [];
  const violationsMap = new Map();
  for (const v of rawViolations) {
    const id = v.id || 'unknown';
    const meta = RULE_METADATA[id] || { wcagRef: 'WCAG 2.1 AA', impactStatement: 'Check accessibility' };
    const wcagRef = v.wcag || meta.wcagRef;
    const dedupKey = `${wcagRef}-${id}`;
    if (violationsMap.has(dedupKey)) {
      const existing = violationsMap.get(dedupKey);
      const existingNodeKeys = new Set(existing.nodes.map(n => `${n.target}|${n.html}`));
      const newNodes = Array.isArray(v.nodes) ? v.nodes : [];
      for (const node of newNodes) {
        const nodeKey = `${Array.isArray(node.target) ? node.target.join(' ') : (node.target || '')}|${node.html || ''}`;
        if (!existingNodeKeys.has(nodeKey)) {
          existingNodeKeys.add(nodeKey);
          existing.nodes.push(node);
        }
      }
    } else {
      violationsMap.set(dedupKey, { ...v, wcag: wcagRef });
    }
  }
  const violations = Array.from(violationsMap.values());
  let md = '# WCAG / ADA Remediation Report\n\n';
  md += '**Target URL:** ' + target + '  \n';
  md += '**Audit Timestamp:** ' + timestamp + '  \n';
  md += '**Test Method:** automated  \n\n';
  md += '## 1. Executive Scorecard & Legal Risk Summary\n\n';
  md += '- **Total Issues Detected:** ' + summary.total + '\n\n';
  md += '## 2. Prioritized Issue Matrix\n\n';
  md += '| Severity | Rule ID | WCAG Ref | Test Method | Description |\n';
  md += '| :--- | :--- | :--- | :--- | :--- |\n';
  for (const v of violations) {
    const impact = (v.impact || 'moderate').toUpperCase();
    const id = v.id || 'unknown';
    const meta = RULE_METADATA[id] || { wcagRef: 'N/A' };
    md += '| **' + impact + '** | `' + id + '` | ' + (v.wcag || meta.wcagRef) + ' | automated | ' + (v.description || 'N/A') + ' |\n';
  }
  md += '\n## 3. Engineering Remediation Cards\n\n';
  violations.forEach((v, index) => {
    const impact = (v.impact || 'MODERATE').toUpperCase();
    const meta = RULE_METADATA[v.id] || { wcagRef: 'N/A', impactStatement: 'No metadata' };
    md += '### ' + (index + 1) + '. [' + impact + '] ' + v.id + '\n\n';
    md += '- **WCAG Criterion:** ' + (v.wcag || meta.wcagRef) + '\n';
    md += '- **Assistive Technology Barrier:** ' + meta.impactStatement + '\n\n';
    if (v.nodes && v.nodes.length > 0) {
      md += '#### Recommended Remediation:\n\n```html\n' + generateFixedSnippet(v.id, v.nodes[0].html) + '\n```\n\n';
    }
  });
  md += '## 4. Accessibility Statement\n\n';
  md += 'This report provides a comprehensive WCAG / ADA audit summary and remediation roadmap.\n';
  return md;
}

export function writeReportToFile(auditData, outputPath = 'REMEDIATION_REPORT.md') {
  const markdown = generateMarkdownReport(auditData);
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  fs.writeFileSync(resolvedPath, markdown, 'utf8');
  return resolvedPath;
}

export default { RULE_METADATA, generateMarkdownReport, writeReportToFile };
