/**
 * reporter.js - Markdown remediation report compiler
 * Implements FR-REPORT-01 through FR-REPORT-03
 */
import fs from 'fs';
import path from 'path';

/**
 * Transforms problematic HTML snippets into compliant, copy-pasteable code fixes.
 */
function generateFixedSnippet(ruleId, originalHtml = '') {
  if (!originalHtml) return '<!-- Corrected markup unavailable -->';

  switch (ruleId) {
    case 'color-contrast': {
      // Adjust low-contrast styling (e.g., replace light grey text with accessible dark slate)
      if (/style=["'][^"']*color:\s*#[cC]{3}/i.test(originalHtml)) {
        return originalHtml.replace(/color:\s*#[cC]{3}/i, 'color: #2b2b2b');
      }
      return originalHtml.replace(/style=["']([^"']*)["']/, 'style="$1; color: #111111; background-color: #ffffff;"');
    }

    case 'image-alt': {
      // Add descriptive alt tag if missing
      if (!/alt=/i.test(originalHtml)) {
        return originalHtml.replace(/<img\b/i, '<img alt="Descriptive photo of pool quartz finish"');
      }
      return originalHtml.replace(/alt=["']\s*["']/, 'alt="Descriptive photo of pool quartz finish"');
    }

    case 'heading-order': {
      // Step heading level down into compliant hierarchy (e.g., h4 -> h2)
      return originalHtml
        .replace(/<h[3-6]\b/i, '<h2')
        .replace(/<\/h[3-6]>/i, '</h2>');
    }

    case 'link-name': {
      if (originalHtml.includes('><')) {
        return originalHtml.replace('><', '>Read Full Report<');
      }
      return originalHtml.replace(/<a\b/i, '<a aria-label="Visit audit details"');
    }

    case 'button-name': {
      if (!/aria-label/i.test(originalHtml)) {
        return originalHtml.replace(/<button\b/i, '<button aria-label="Submit action"');
      }
      return originalHtml;
    }

    default:
      // Fallback: annotate the specific rule needed directly on the element
      return originalHtml.replace(/>/, ` data-wcag-fix="${ruleId}">`);
  }
}

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
        const problemHtml = v.nodes[0].html || '<!-- Node snippet unavailable -->';
        const fixedHtml = generateFixedSnippet(v.id, problemHtml);
        md += '```html\n' + fixedHtml + '\n```\n\n';      }
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
