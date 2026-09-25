/**
 * reporter.js - Markdown remediation report compiler
 * Implements FR-REPORT-01 through FR-REPORT-03
 */
import fs from 'fs';
import path from 'path';

export function generateMarkdownReport(auditData = {}) {
  const target = auditData.scanTarget || auditData.url || 'Unknown Target';
  const timestamp = auditData.timestamp || new Date().toISOString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const violations = auditData.violations || [];

  let md = `# WCAG / ADA Remediation Report\n\n`;
  md += `**Target URL:** ${target}  \n`;
  md += `**Audit Timestamp:** ${timestamp}  \n\n`;

  // Section 1: Executive Scorecard & Legal Risk Summary
  md += `## 1. Executive Scorecard & Legal Risk Summary\n\n`;
  md += `This report provides an accessibility compliance audit against WCAG 2.1 Level AA standards and ADA requirements. Detected barriers present potential legal exposure and restrict access for users relying on assistive technologies.\n\n`;
  md += `- **Critical Violations:** ${summary.critical}\n`;
  md += `- **Serious Violations:** ${summary.serious}\n`;
  md += `- **Moderate Violations:** ${summary.moderate}\n`;
  md += `- **Minor Violations:** ${summary.minor}\n`;
  md += `- **Total Issues Detected:** ${summary.total}\n\n`;

  // Section 2: Prioritized Issue Matrix
  md += `## 2. Prioritized Issue Matrix\n\n`;
  md += `| Severity | Rule ID | WCAG Ref | Description |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;

  if (violations.length === 0) {
    md += `| NONE | -- | -- | No accessibility violations detected. |\n`;
  } else {
    for (const v of violations) {
      const impact = (v.impact || 'moderate').toUpperCase();
      const id = v.id || 'unknown';
      const wcagRef = v.wcag || 'WCAG 2.1 AA';
      const desc = (v.description || 'N/A').replace(/\|/g, '\\|');
      md += '| **' + impact + '** | `' + id + '` | ' + wcagRef + ' | ' + desc + ' |\n';
    }
  }
  md += `\n`;

  // Section 3: Engineering Remediation Cards
  md += `## 3. Engineering Remediation Cards\n\n`;
  if (violations.length === 0) {
    md += `_No accessibility violations detected._\n\n`;
  } else {
    violations.forEach((v, index) => {
      const impact = (v.impact || 'MODERATE').toUpperCase();
      md += `### ${index + 1}. [${impact}] ${v.id}\n\n`;
      md += `- **WCAG Criterion:** ${v.wcag || 'WCAG 2.1 Level AA'}\n`;
      md += `- **Assistive Technology Barrier:** Users relying on screen readers, keyboard navigation, or magnification may experience failure to perceive or interact with this component.\n`;
      md += `- **Rule URL:** ${v.helpUrl || 'N/A'}\n\n`;

      if (v.nodes && v.nodes.length > 0) {
        md += `#### Current Problematic HTML:\n\n`;
        v.nodes.slice(0, 3).forEach((n) => {
          md += '```html\n' + (n.html || '<!-- Node snippet unavailable -->') + '\n```\n\n';
          if (n.failureSummary) {
            md += `**Failure Summary:** ${n.failureSummary}\n\n`;
          }
        });

        md += `#### Recommended Remediation:\n\n`;
        md += '```html\n<!-- Apply corrective attributes, semantic markup, or ARIA roles addressing the failure summary -->\n```\n\n';
      }
    });
  }

  // Section 4: Accessibility Statement
  md += `## 4. Accessibility Statement\n\n`;
  md += `This organization is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards, conforming to WCAG 2.1 Level AA guidelines.\n\n`;
  md += `### Feedback & Contact\n`;
  md += `We welcome your feedback on the accessibility of this property. Please let us know if you encounter accessibility barriers by contacting our support team.\n\n`;

  return md;
}

export function writeReportToFile(auditData, outputPath = 'REMEDIATION_REPORT.md') {
  const markdown = generateMarkdownReport(auditData);
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  fs.writeFileSync(resolvedPath, markdown, 'utf8');
  return resolvedPath;
}

export default { generateMarkdownReport, writeReportToFile };
