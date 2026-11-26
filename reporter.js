/**
 * reporter.js - Markdown remediation report compiler
 * Implements FR-REPORT-01 through FR-REPORT-03 & Level A/Form/Media/ARIA Metadata Mapping
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function generateFixedSnippet(ruleId, originalHtml = '') {
  if (!originalHtml) return '<!-- Corrected markup unavailable -->';

  const entry = rawDictionary[ruleId];
  if (entry && entry.compliantCodeExample) {
    if (ruleId === 'meta-viewport') {
      return entry.compliantCodeExample;
    }
  }

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
    case 'css-orientation-lock': {
      return originalHtml.replace(/orientation:\s*[^;]+/i, 'orientation: auto');
    }
    case 'autocomplete-valid': {
      return originalHtml.replace(/<input\b/i, '<input autocomplete="given-name"');
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
      return originalHtml.replace(/lang=["'][a-zA-Z0-9\-]+["']/i, 'lang="en"').replace(/<html\b/i, '<html lang="en"');
    }
    case 'valid-lang': {
      return originalHtml.replace(/lang=["'][a-zA-Z0-9\-]+["']/i, 'lang="en"');
    }
    case 'duplicate-id': {
      return originalHtml.replace(/id=["']([^"']+)["']/i, 'id="$1-unique"');
    }
    case 'aria-allowed-attr':
    case 'aria-required-attr': {
      if (/aria-selected/i.test(originalHtml) && !/role=["']tab["']/i.test(originalHtml)) {
        return originalHtml.replace(/<button\b/i, '<button role="tab" aria-selected="false"');
      }
      return originalHtml.replace(/<([a-zA-Z0-9]+)\b/i, '<$1 aria-describedby="desc-id"');
    }
    case 'color-contrast': {
      if (/style=["']/i.test(originalHtml)) {
        if (/color:\s*[^;"]+/i.test(originalHtml)) {
          return originalHtml.replace(/color:\s*[^;"]+/, 'color: #1f2937');
        }
        return originalHtml.replace(/style=["']([^"]*)["']/, 'style="$1; color: #1f2937;"');
      }
      return originalHtml.replace(/<([a-zA-Z0-9]+)\b/, '<$1 style="color: #1a365d;"');
    }
    case 'meta-viewport': {
      return '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    }
    case 'empty-heading': {
      return originalHtml.replace(/<h([1-6])([^>]*)>\s*<\/h\1>/i, '<h$1$2>Section Title</h$1>');
    }
    case 'focus-visible': {
      return originalHtml.replace(/<([a-zA-Z0-9]+)\b/i, '<$1 class="focusable-element"');
    }
    case 'image-alt': {
      if (!/alt=/i.test(originalHtml)) {
        return originalHtml.replace(/<img\b/i, '<img alt="Descriptive image context"');
      }
      return originalHtml.replace(/alt=["']\s*["']/, 'alt="Descriptive image context"');
    }
    case 'area-alt': {
      if (!/alt=/i.test(originalHtml)) {
        return originalHtml.replace(/<area\b/i, '<area alt="Map navigation target"');
      }
      return originalHtml.replace(/alt=["']\s*["']/, 'alt="Map navigation target"');
    }
    case 'object-alt': {
      return '<object>\n  <p>Alternative content description for embedded object.</p>\n  ' + originalHtml + '\n</object>';
    }
    case 'video-caption': {
      return originalHtml.replace(/<video\b/i, '<video><track kind="captions" src="captions.vtt" srclang="en" label="English" default></track>');
    }
    case 'audio-caption': {
      return '<audio controls>\n  <track kind="captions" src="transcript.vtt" srclang="en" label="English">\n  ' + originalHtml + '\n</audio>';
    }
    case 'blink': {
      return originalHtml.replace(/style=["']([^""]*)blink([^""]*)["']/gi, 'style="$1none$2"');
    }
    case 'label': {
      if (!/<label/i.test(originalHtml) && /<input\b/i.test(originalHtml)) {
        return '<label for="input-id">Input Label</label>\n' + originalHtml.replace(/<input\b/i, '<input id="input-id"');
      }
      return '<label>Label Title\n  ' + originalHtml + '\n</label>';
    }
    case 'label-title-only': {
      return originalHtml.replace(/aria-label=["']([^""]+)["']/i, 'aria-label="Matching Visible Label Text"');
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
      if (entry && entry.compliantCodeExample) {
        return entry.compliantCodeExample;
      }
      return originalHtml.replace(/>/, ' data-wcag-fix="' + ruleId + '">');
  }
}

export function generateMarkdownReport(auditData = {}) {
  const target = auditData.scanTarget || auditData.url || 'Unknown Target';
  const timestamp = auditData.timestamp || new Date().toISOString();
  const summary = auditData.summary || { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  const rawViolations = auditData.violations || [];

  const violationsMap = new Map();
  for (const v of rawViolations) {
    const id = v.id || 'unknown';
    const meta = RULE_METADATA[id] || {};
    const wcagRef = v.wcag || meta.wcagRef || 'WCAG 2.1 AA';
    
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
      violationsMap.set(dedupKey, {
        ...v,
        wcag: wcagRef
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
        const fixedHtml = generateFixedSnippet(v.id, problemHtml);
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

export default { RULE_METADATA, generateMarkdownReport, writeReportToFile };
