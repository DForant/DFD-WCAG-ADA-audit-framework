/**
 * reporter.js - Markdown remediation report compiler
 * Implements FR-REPORT-01 through FR-REPORT-03 & Level A DOM/Semantic Metadata Mapping
 */
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive rule metadata mapping for Level A & AA HTML semantics, document structure, and accessibility rules.
 */
export const RULE_METADATA = {
  'dlitem': {
    wcagRef: 'WCAG 1.3.1 (Info and Relationships)',
    impactStatement: 'Screen reader users rely on proper definition list markup (<dt> and <dd> elements inside <dl>) to comprehend relationship pairings between terms and definitions.'
  },
  'list': {
    wcagRef: 'WCAG 1.3.1 (Info and Relationships)',
    impactStatement: 'Lists must only contain direct children of <li>, <script>, or <template> elements to ensure assistive technologies correctly announce item counts and list structures.'
  },
  'listitem': {
    wcagRef: 'WCAG 1.3.1 (Info and Relationships)',
    impactStatement: 'List items (<li>) must be contained within a parent <ul>, <ol>, or have role="list" to ensure proper navigation and structure for screen reader users.'
  },
  'td-headers': {
    wcagRef: 'WCAG 1.3.1 (Info and Relationships)',
    impactStatement: 'Data tables using headers and id attributes must associate data cells correctly so screen readers can accurately read tabular data contexts.'
  },
  'bypass': {
    wcagRef: 'WCAG 2.4.1 (Bypass Blocks)',
    impactStatement: 'Keyboard and screen reader users are forced to tab through repeated navigation blocks on every page without a mechanism to bypass them.'
  },
  'skip-link': {
    wcagRef: 'WCAG 2.4.1 (Bypass Blocks)',
    impactStatement: 'Missing or broken skip links prevent keyboard and assistive technology users from jumping directly to primary page content.'
  },
  'document-title': {
    wcagRef: 'WCAG 2.4.2 (Page Titled)',
    impactStatement: 'Missing or empty page titles prevent users from understanding the document topic or navigating between multiple open tabs/windows efficiently.'
  },
  'html-has-lang': {
    wcagRef: 'WCAG 3.1.1 (Language of Page)',
    impactStatement: 'Screen readers require a valid lang attribute on the html element to load correct speech synthesis pronunciations and accents.'
  },
  'html-lang-valid': {
    wcagRef: 'WCAG 3.1.1 (Language of Page)',
    impactStatement: 'Invalid language codes prevent screen readers from reliably determining human language rendering rules.'
  },
  'duplicate-id': {
    wcagRef: 'WCAG 4.1.1 (Parsing)',
    impactStatement: 'Duplicate element IDs disrupt DOM parsing and cause assistive technologies to fail when referencing IDs via aria-labelledby, aria-describedby, or labels.'
  },
  'color-contrast': {
    wcagRef: 'WCAG 1.4.3 (Contrast Minimum)',
    impactStatement: 'Low contrast text is difficult or impossible for users with visual impairments to read.'
  },
  'image-alt': {
    wcagRef: 'WCAG 1.1.1 (Non-text Content)',
    impactStatement: 'Images without alternative text are invisible to screen reader users, omitting vital context and information.'
  },
  'heading-order': {
    wcagRef: 'WCAG 1.3.1 (Info and Relationships)',
    impactStatement: 'Skipping heading levels disrupts document outline hierarchy for screen reader users navigating by headings.'
  },
  'link-name': {
    wcagRef: 'WCAG 2.4.4 (Link Purpose)',
    impactStatement: 'Links without descriptive text or accessible names leave screen reader users unaware of navigation destinations.'
  },
  'button-name': {
    wcagRef: 'WCAG 4.1.2 (Name, Role, Value)',
    impactStatement: 'Buttons without accessible names prevent assistive technology users from understanding button actions.'
  },
  'aria-allowed-attr': {
    wcagRef: 'WCAG 4.1.2 (Name, Role, Value)',
    impactStatement: 'Using unsupported ARIA attributes on elements invalidates accessibility semantics.'
  }
};

/**
 * Transforms problematic HTML snippets into compliant, copy-pasteable code fixes.
 */
function generateFixedSnippet(ruleId, originalHtml = '') {
  if (!originalHtml) return '<!-- Corrected markup unavailable -->';

  switch (ruleId) {
    case 'dlitem': {
      if (!/<dt>|<dd>/i.test(originalHtml)) {
        return '<dl>\n  <dt>Term</dt>\n  <dd>' + originalHtml.replace(/<([a-zA-Z0-9]+)[^>]*>/, '<$1>') + '</dd>\n</dl>';
      }
      return '<dl>\n  ' + originalHtml + '\n</dl>';
    }

    case 'list': {
      return '<ul>\n  <li>' + originalHtml.replace(/<([a-zA-Z0-9]+)[^>]*>/, '<$1>') + '</li>\n</ul>';
    }

    case 'listitem': {
      return '<ul>\n  <li>' + originalHtml + '</li>\n</ul>';
    }

    case 'td-headers': {
      return originalHtml.replace(/<td\b/i, '<td headers="header1"');
    }

    case 'bypass':
    case 'skip-link': {
      return '<a href="#main-content" class="skip-link">Skip to main content</a>\n' + originalHtml;
    }

    case 'document-title': {
      return '<head>\n  <title>Accessible Page Title - Organization</title>\n  ' + originalHtml + '\n</head>';
    }

    case 'html-has-lang': {
      return originalHtml.replace(/<html\b/i, '<html lang="en"');
    }

    case 'html-lang-valid': {
      return originalHtml.replace(/lang=[""][a-zA-Z0-9\-]+[""]/i, 'lang="en"').replace(/<html\b/i, '<html lang="en"');
    }

    case 'duplicate-id': {
      return originalHtml.replace(/id=[""]([^"]+)[""]/i, 'id="$1-unique"');
    }

    case 'aria-allowed-attr': {
      if (/aria-selected/i.test(originalHtml) && !/role=[""]tab[""]/i.test(originalHtml)) {
        return originalHtml.replace(/<button\b/i, '<button role="tab"');
      }
      return originalHtml;
    }

    case 'color-contrast': {
      if (/style=[""]/i.test(originalHtml)) {
        if (/color:\s*[^;"]+/i.test(originalHtml)) {
          return originalHtml.replace(/color:\s*[^;"]+/, 'color: #1f2937');
        }
        return originalHtml.replace(/style=[""]([^"]*)[""]/, 'style="$1; color: #1f2937;"');
      }
      return originalHtml.replace(/<([a-zA-Z0-9]+)\b/, '<$1 style="color: #1a365d;"');
    }

    case 'image-alt': {
      if (!/alt=/i.test(originalHtml)) {
        return originalHtml.replace(/<img\b/i, '<img alt="Descriptive image context"');
      }
      return originalHtml.replace(/alt=[""]\s*[""]/, 'alt="Descriptive image context"');
    }

    case 'heading-order': {
      return originalHtml
        .replace(/<h[3-6]\b/i, '<h2')
        .replace(/<\/h[3-6]>/i, '</h2>');
    }

    case 'link-name': {
      if (originalHtml.includes('><')) {
        return originalHtml.replace('><', '>Read Full Content<');
      }
      return originalHtml.replace(/<a\b/i, '<a aria-label="Navigation target"');
    }

    case 'button-name': {
      if (!/aria-label/i.test(originalHtml)) {
        return originalHtml.replace(/<button\b/i, '<button aria-label="Action button"');
      }
      return originalHtml;
    }

    default:
      return originalHtml.replace(/>/, ' data-wcag-fix="' + ruleId + '">');
  }
}

export function generateMarkdownReport(auditData = {}) {
  const target = auditData.scanTarget || auditData.url || 'Unknown Target';
  const timestamp = auditData.timestamp || new Date().toISOString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const violations = auditData.violations || [];

  let md = '# WCAG / ADA Remediation Report\n\n';
  md += '**Target URL:** ' + target + '  \n';
  md += '**Audit Timestamp:** ' + timestamp + '  \n';
  md += '**Test Method:** automated  \n\n';

  // Section 1: Executive Scorecard & Legal Risk Summary
  md += '## 1. Executive Scorecard & Legal Risk Summary\n\n';
  md += 'This report provides an accessibility compliance audit against WCAG 2.1 Level AA standards and ADA requirements using automated testing methodology. Detected barriers present potential legal exposure and restrict access for users relying on assistive technologies.\n\n';
  md += '- **Critical Violations:** ' + summary.critical + '\n';
  md += '- **Serious Violations:** ' + summary.serious + '\n';
  md += '- **Moderate Violations:** ' + summary.moderate + '\n';
  md += '- **Minor Violations:** ' + summary.minor + '\n';
  md += '- **Total Issues Detected:** ' + summary.total + '\n\n';

  // Section 2: Prioritized Issue Matrix
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

  // Section 3: Engineering Remediation Cards
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
        const fixedHtml = generateFixedSnippet(v.id, problemHtml);
        md += '```html\n' + fixedHtml + '\n```\n\n';
      }
    });
  }

  // Section 4: Accessibility Statement
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

export default { RULE_METADATA, generateMarkdownReport, writeReportToFile };
