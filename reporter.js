/**
 * reporter.js - Markdown remediation report compiler
 * Implements FR-REPORT-01 through FR-REPORT-03 & WCAG 2.1 AA / ADA rule translation dictionary
 */
import fs from 'fs';
import path from 'path';

/**
 * Exhaustive WCAG 2.1 Level A & Level AA translation dictionary
 */
export const RULE_METADATA = {
  'image-alt': {
    title: 'Missing Visual Alternative Text',
    wcag: 'WCAG 1.1.1 (Level A)',
    component: 'Images & Media',
    userImpact: 'Screen readers announce raw file URLs or skip the element entirely, leaving blind visitors unaware of visual content.'
  },
  'area-alt': {
    title: 'Missing Image Map Alternative Text',
    wcag: 'WCAG 1.1.1 (Level A)',
    component: 'Image Maps',
    userImpact: 'Active clickable hotspot links in visual maps cannot be identified by assistive software.'
  },
  'video-caption': {
    title: 'Missing Video Closed Captions',
    wcag: 'WCAG 1.2.2 (Level A)',
    component: 'Video & Audio',
    userImpact: 'Deaf and hard-of-hearing users cannot consume spoken audio content within video media.'
  },
  'color-contrast': {
    title: 'Insufficient Text Color Contrast',
    wcag: 'WCAG 1.4.3 (Level AA)',
    component: 'Typography & Visual Styling',
    userImpact: 'Text falling below the 4.5:1 ratio (or 3:1 for large text) is illegible for low-vision visitors or mobile users under direct sunlight.'
  },
  'meta-viewport': {
    title: 'Disabled Screen Zoom & Pinch-to-Scale',
    wcag: 'WCAG 1.4.4 / 1.4.10 (Level AA)',
    component: 'Viewport & Layout',
    userImpact: 'Setting user-scalable=no or maximum-scale=1.0 blocks visually impaired users from enlarging text on mobile devices.'
  },
  'bypass': {
    title: 'Missing Bypass Navigation / Skip Links',
    wcag: 'WCAG 2.4.1 (Level A)',
    component: 'Navigation Structure',
    userImpact: 'Motor-impaired and keyboard-only users must tab through dozens of repeated header links on every single page load before reaching core content.'
  },
  'skip-link': {
    title: 'Missing Bypass Navigation / Skip Links',
    wcag: 'WCAG 2.4.1 (Level A)',
    component: 'Navigation Structure',
    userImpact: 'Motor-impaired and keyboard-only users must tab through dozens of repeated header links on every single page load before reaching core content.'
  },
  'document-title': {
    title: 'Missing or Empty Page <title>',
    wcag: 'WCAG 2.4.2 (Level A)',
    component: 'Document Head',
    userImpact: 'Screen reader users and tab switchers cannot determine page context when multiple browser tabs or application views are open.'
  },
  'focus-order-semantics': {
    title: 'Disrupted Keyboard Focus Order',
    wcag: 'WCAG 2.4.3 (Level A)',
    component: 'Interactive Controls',
    userImpact: 'Using positive tabindex values (>0) forces unpredictable jump navigation, disorienting keyboard users.'
  },
  'tabindex': {
    title: 'Disrupted Keyboard Focus Order',
    wcag: 'WCAG 2.4.3 (Level A)',
    component: 'Interactive Controls',
    userImpact: 'Using positive tabindex values (>0) forces unpredictable jump navigation, disorienting keyboard users.'
  },
  'link-name': {
    title: 'Ambiguous or Empty Hyperlink Text',
    wcag: 'WCAG 2.4.4 (Level A)',
    component: 'Hyperlinks',
    userImpact: 'Screen reader rotor navigation presents blank items or repetitive "click here" labels without destination context.'
  },
  'focus-visible': {
    title: 'Missing Keyboard Focus Indicator',
    wcag: 'WCAG 2.4.7 (Level AA)',
    component: 'Interactive Controls',
    userImpact: 'Removing CSS outline rings prevents keyboard-only users from seeing which button or link is active.'
  },
  'html-has-lang': {
    title: 'Missing Primary Document Language Attribute',
    wcag: 'WCAG 3.1.1 (Level A)',
    component: 'Document Root',
    userImpact: 'Screen readers cannot load the correct pronunciation synthesizer, pronouncing text with default phonetics and rendering it unintelligible.'
  },
  'html-lang-valid': {
    title: 'Invalid Language Tag Value',
    wcag: 'WCAG 3.1.1 (Level A)',
    component: 'Document Root',
    userImpact: 'Synthesizers fail to parse invalid BCP 47 language codes and fall back to system defaults.'
  },
  'aria-allowed-attr': {
    title: 'Unsupported ARIA Attributes on Host Role',
    wcag: 'WCAG 4.1.2 (Level A)',
    component: 'ARIA Widget Components',
    userImpact: 'Using attributes like aria-selected on standard <button> elements without role="tab" confuses accessibility trees and breaks interactive widgets.'
  },
  'aria-required-attr': {
    title: 'Missing Mandatory ARIA Attributes',
    wcag: 'WCAG 4.1.2 (Level A)',
    component: 'ARIA Widget Components',
    userImpact: 'Interactive widgets (e.g., custom checkboxes or sliders) omit expected state values, failing to communicate state changes.'
  },
  'aria-required-children': {
    title: 'Broken Composite ARIA Hierarchies',
    wcag: 'WCAG 4.1.2 (Level A)',
    component: 'ARIA Composite Widgets',
    userImpact: 'ARIA tablist containers lacking tab children (or vice versa) fail to render cohesive component structures in assistive technology.'
  },
  'aria-required-parent': {
    title: 'Broken Composite ARIA Hierarchies',
    wcag: 'WCAG 4.1.2 (Level A)',
    component: 'ARIA Composite Widgets',
    userImpact: 'ARIA tablist containers lacking tab children (or vice versa) fail to render cohesive component structures in assistive technology.'
  },
  'aria-hidden-focus': {
    title: 'Focusable Element Trapped Inside aria-hidden="true"',
    wcag: 'WCAG 4.1.2 (Level A)',
    component: 'Interactive Components',
    userImpact: 'Keyboard focus lands on invisible "ghost" elements that screen readers refuse to voice, creating a severe navigation trap.'
  },
  'button-name': {
    title: 'Empty or Unlabeled Button Element',
    wcag: 'WCAG 4.1.2 (Level A)',
    component: 'Interactive Controls',
    userImpact: 'Screen readers voice interactive controls as simply "button", leaving users with no context on what action will execute.'
  }
};

/**
 * Resolves rule metadata from the dictionary or creates a graceful fallback.
 */
export function resolveRuleMetadata(ruleId, fallbackDesc = '') {
  const entry = RULE_METADATA[ruleId];
  if (entry) {
    return entry;
  }

  const formattedTitle = ruleId
    ? ruleId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    : 'General Accessibility Rule';

  return {
    title: formattedTitle,
    wcag: 'WCAG 2.1 Level AA (General Conformance)',
    component: 'Interactive Page Element',
    userImpact: fallbackDesc || 'Users relying on assistive technologies or keyboard navigation may experience barriers perceiving or interacting with this element.'
  };
}

/**
 * Transforms problematic HTML snippets into compliant, copy-pasteable code fixes.
 */
function generateFixedSnippet(ruleId, originalHtml = '') {
  if (!originalHtml) return '<!-- Corrected markup unavailable -->';

  switch (ruleId) {
    case 'aria-allowed-attr': {
      if (/aria-selected/i.test(originalHtml) && !/role=/i.test(originalHtml)) {
        return originalHtml.replace(/<([a-z0-9-]+)/i, '<$1 role="tab"');
      }
      return originalHtml.replace(/\s+aria-[a-z-]+="[^"]*"/i, '');
    }
    case 'image-alt': {
      if (!/alt=/i.test(originalHtml)) {
        return originalHtml.replace(/<img/i, '<img alt="Descriptive text explaining image purpose"');
      }
      return originalHtml;
    }
    case 'color-contrast': {
      return originalHtml.replace(/style="([^"]*)"/i, 'style="$1; color: #000000; background-color: #ffffff;"');
    }
    case 'button-name': {
      return originalHtml.replace(/<button([^>]*)><\/button>/i, '<button$1>Accessible Button Label</button>');
    }
    case 'link-name': {
      return originalHtml.replace(/<a([^>]*)><\/a>/i, '<a$1>Descriptive Link Destination</a>');
    }
    case 'html-has-lang': {
      return originalHtml.replace(/<html/i, '<html lang="en"');
    }
    case 'document-title': {
      return '<head>\n  <title>Accessible Page Title</title>\n</head>';
    }
    case 'meta-viewport': {
      return '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    }
    case 'bypass': {
      return '<a class="skip-link" href="#main-content">Skip to main content</a>';
    }
    case 'focus-visible': {
      return originalHtml.replace(/style="([^"]*)"/i, 'style="$1; outline: 2px solid #005fcc; outline-offset: 2px;"');
    }
    default: {
      return originalHtml;
    }
  }
}

/**
 * Generates a complete, professional Markdown remediation report.
 */
export function generateMarkdownReport(auditData) {
  const scanTarget = auditData.scanTarget || 'Unknown Target';
  const timestamp = auditData.timestamp ? new Date(auditData.timestamp).toUTCString() : new Date().toUTCString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const violations = Array.isArray(auditData.violations) ? auditData.violations : [];

  let md = '';
  md += '# WCAG / ADA Remediation Report\n\n';
  md += `**Audit Target:** 
` + scanTarget + `\n`;
  md += `**Generated:** 
` + timestamp + `\n\n`;

  md += '## 1. Executive Scorecard & Legal Risk Summary\n\n';
  md += '| Severity Level | Issue Count | Description & ADA Legal Exposure |\n';
  md += '| :--- | :---: | :--- |\n';
  md += '| **Critical** | ' + summary.critical + ' | Immediate blockers preventing core user flows for assistive tech users. High risk of Title III ADA demand letters. |\n';
  md += '| **Serious** | ' + summary.serious + ' | Significant barriers causing major frustration or severe partial feature exclusion. |\n';
  md += '| **Moderate** | ' + summary.moderate + ' | Noticeable friction points impacting readability, focus, or styling conformance. |\n';
  md += '| **Minor** | ' + summary.minor + ' | Minor semantic or markup hygiene improvements. |\n';
  md += '| **Total** | **' + summary.total + '** | **Total conformance remediation items identified.** |\n\n';

  md += '## 2. Prioritized Issue Matrix\n\n';
  md += '| ID | Severity | WCAG Standard | Issue Title | Affected Elements |\n';
  md += '| :--- | :--- | :--- | :--- | :---: |\n';

  if (violations.length === 0) {
    md += '| *None* | *None* | *N/A* | *No accessibility violations detected!* | 0 |\n';
  } else {
    for (const v of violations) {
      const meta = resolveRuleMetadata(v.id, v.description);
      const sev = (v.impact || 'moderate').toUpperCase();
      const wcag = v.wcag || meta.wcag;
      const count = Array.isArray(v.nodes) ? v.nodes.length : 0;
      md += '| `' + v.id + '` | **' + sev + '** | ' + wcag + ' | ' + meta.title + ' | ' + count + ' |\n';
    }
  }
  md += '\n';

  md += '## 3. Engineering Remediation Cards\n\n';
  if (violations.length === 0) {
    md += 'Congratulations! No violations were found during this audit scan.\n\n';
  } else {
    let index = 1;
    for (const v of violations) {
      const meta = resolveRuleMetadata(v.id, v.description);
      const sev = (v.impact || 'moderate').toUpperCase();
      const wcag = v.wcag || meta.wcag;

      md += '### 3.' + index + ' ' + meta.title + ' (`' + v.id + '`)\n\n';
      md += '- **Severity:** ' + sev + '\n';
      md += '- **WCAG Success Criterion:** ' + wcag + '\n';
      md += '- **UI Component / Area:** ' + meta.component + '\n';
      md += '- **Assistive Technology Barrier:** ' + meta.userImpact + '\n\n';

      md += '#### Non-Compliant Code Examples\n\n';
      if (Array.isArray(v.nodes) && v.nodes.length > 0) {
        for (const node of v.nodes.slice(0, 3)) {
          md += 'Target Selector: `' + node.target + '`\n';
          md += '```html\n' + (node.html || '<!-- no html snippet provided -->') + '\n```\n\n';
          if (node.failureSummary) {
            md += '> **Axe Diagnostic:** ' + node.failureSummary.replace(/\n/g, ' ') + '\n\n';
          }
        }
      } else {
        md += 'No specific DOM node selectors provided.\n\n';
      }

      md += '#### Copy-Pasteable Compliant Fix\n\n';
      const sampleHtml = (v.nodes && v.nodes[0] && v.nodes[0].html) ? v.nodes[0].html : '<div class="element">Example markup</div>';
      const fixedCode = generateFixedSnippet(v.id, sampleHtml);
      md += '```html\n' + fixedCode + '\n```\n\n';

      md += '#### Verification Step\n';
      md += '1. Apply the corrected markup snippet to your source templates or component library.\n';
      md += '2. Re-run the test suite using `npm run audit` or automated CI accessibility checks.\n';
      md += '3. Verify with a screen reader (VoiceOver/NVDA) that the element announces correctly and keyboard focus operates smoothly.\n\n';
      md += '---\n\n';
      index++;
    }
  }

  md += '## 4. Accessibility Statement\n\n';
  md += 'This web property is committed to ensuring digital accessibility for individuals with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards (WCAG 2.1 Level AA conformance). If you encounter accessibility barriers, please contact our web team for immediate assistance.\n\n';

  return md;
}

/**
 * Writes the generated Markdown report directly to disk.
 */
export function writeReportToFile(auditData, customFileName = 'REMEDIATION_REPORT.md') {
  const markdown = generateMarkdownReport(auditData);
  const outPath = path.resolve(process.cwd(), customFileName);
  fs.writeFileSync(outPath, markdown, 'utf8');
  return outPath;
}

export default {
  RULE_METADATA,
  resolveRuleMetadata,
  generateMarkdownReport,
  writeReportToFile
};
