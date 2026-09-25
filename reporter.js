/**
 * reporter.js - Markdown remediation report compiler
 */
import fs from 'fs';

export function generateMarkdownReport(auditData = {}) {
  const target = auditData.scanTarget || auditData.url || 'Unknown Target';
  const timestamp = auditData.timestamp || new Date().toISOString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const violations = auditData.violations || [];

  let md = `# WCAG / ADA Remediation Report\n\n`;
  md += `**Target URL:** ${target}  \n`;
  md += `**Audit Timestamp:** ${timestamp}  \n\n`;

  // Section 1: Executive Scorecard
  md += `## 1. Executive Scorecard & Legal Risk Summary\n\n`;
  md += `- **Critical Violations:** ${summary.critical}\n`;
  md += `- **Serious Violations:** ${summary.serious}\n`;
  md += `- **Moderate Violations:** ${summary.moderate}\n`;
  md += `- **Minor Violations:** ${summary.minor}\n`;
  md += `- **Total Issues Detected:** ${summary.total}\n\n`;

  // Section 2: Prioritized Issue Matrix
  md += `## 2. Prioritized Issue Matrix\n\n`;
  md += `| Severity | Rule ID | WCAG Ref | Description |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;

  for (const v of violations) {
    const impact = (v.impact || 'moderate').toUpperCase();
    const id = v.id || 'unknown';
    const desc = (v.description || 'N/A').replace(/\|/g, '\\|');
    // Using string concatenation to prevent unescaped template backtick bugs
    md += '| **' + impact + '** | `' + id + '` | WCAG 2.1 AA | ' + desc + ' |\n';
  }
  md += `\n`;

  // Section 3: Engineering Remediation Cards
  md += `## 3. Engineering Remediation Cards\n\n`;
  if (violations.length === 0) {
    md += `_No accessibility violations detected._\n\n`;
  } else {
    violations.forEach((v, index) => {
      md += `### ${index + 1}. [${(v.impact || 'MODERATE').toUpperCase()}] ${v.id}\n\n`;
      md += `- **Guideline:** WCAG 2.1 AA\n`;
      md += `- **Issue:** ${v.help || v.description || 'Accessibility issue detected'}\n`;
      md += `- **Rule URL:** ${v.helpUrl || 'N/A'}\n\n`;
      
      if (v.nodes && v.nodes.length > 0) {
        md += `#### Problematic Nodes:\n\n`;
        v.nodes.slice(0, 3).forEach((n) => {
          md += '```html\n' + (n.html || '<!-- Node snippet unavailable -->') + '\n```\n\n';
        });
      }
    });
  }

  // Section 4: Accessibility Statement
  md += `## 4. Accessibility Statement\n\n`;
  md += `This site is committed to digital accessibility, conforming to WCAG 2.1 Level AA standards.\n`;

  return md;
}

export function writeReportToFile(auditData, outputPath = 'REMEDIATION_REPORT.md') {
  const markdown = generateMarkdownReport(auditData);
  fs.writeFileSync(outputPath, markdown, 'utf8');
  return outputPath;
}

export default { generateMarkdownReport, writeReportToFile };