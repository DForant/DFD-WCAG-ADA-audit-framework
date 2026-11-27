/**
 * utils/remediation.js - Pure HTML remediation snippet generator utility
 * Implements pure DOM/string transformation rules for accessibility violations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictionaryPath = path.resolve(__dirname, '../data/wcag-rule-dictionary.json');

let rawDictionary = {};
try {
  if (fs.existsSync(dictionaryPath)) {
    rawDictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  }
} catch (err) {
  console.warn('[remediation] Failed to load wcag-rule-dictionary.json:', err.message);
}

/**
 * Generates a remediated, compliant HTML snippet for a given rule and problematic source HTML.
 * @param {string} ruleId - The rule identifier (e.g., 'image-alt')
 * @param {string} originalHtml - The problematic original HTML string
 * @returns {string} The fixed HTML code snippet
 */
export function generateFixedSnippet(ruleId, originalHtml = '') {
  const safeHtml = typeof originalHtml === 'string' ? originalHtml : String(originalHtml || '');
  if (!safeHtml.trim()) {
    const entry = rawDictionary[ruleId];
    if (entry && entry.compliantCodeExample) {
      return entry.compliantCodeExample;
    }
    return '<!-- Corrected markup unavailable -->';
  }

  const entry = rawDictionary[ruleId];
  if (entry && entry.compliantCodeExample) {
    if (ruleId === 'meta-viewport') {
      return entry.compliantCodeExample;
    }
  }

  switch (ruleId) {
    case 'dlitem': {
      if (!/<dt>|<dd>/i.test(safeHtml)) {
        return '<dl>\n  <dt>Term</dt>\n  <dd>' + safeHtml.replace(/<([a-zA-Z0-9]+)[^>]*>/, '<$1>') + '</dd>\n</dl>';
      }
      return '<dl>\n  ' + safeHtml + '\n</dl>';
    }
    case 'list': {
      return '<ul>\n  <li>' + safeHtml.replace(/<([a-zA-Z0-9]+)[^>]*>/, '<$1>') + '</li>\n</ul>';
    }
    case 'listitem': {
      return '<ul>\n  <li>' + safeHtml + '</li>\n</ul>';
    }
    case 'td-headers': {
      return safeHtml.replace(/<td\b/i, '<td headers="header1"');
    }
    case 'css-orientation-lock': {
      return safeHtml.replace(/orientation:\s*[^;]+/i, 'orientation: auto');
    }
    case 'autocomplete-valid': {
      return safeHtml.replace(/<input\b/i, '<input autocomplete="given-name"');
    }
    case 'bypass':
    case 'skip-link': {
      return '<a href="#main-content" class="skip-link">Skip to main content</a>\n' + safeHtml;
    }
    case 'document-title': {
      if (/<head\b[^>]*>/i.test(safeHtml)) {
        return safeHtml.replace(
          /(<head\b[^>]*>)/i,
          '$1\n  <title>Accessible Page Title - Organization</title>'
        );
      }
      return '<head>\n  <title>Accessible Page Title - Organization</title>\n  ' + safeHtml + '\n</head>';
    }
    case 'html-has-lang': {
      return safeHtml.replace(/<html\b/i, '<html lang="en"');
    }
    case 'html-lang-valid': {
      if (/\blang=["'][^"']*["']/i.test(safeHtml)) {
        return safeHtml.replace(/\blang=["'][^"']*["']/i, 'lang="en"');
      }
      return safeHtml.replace(/<html\b/i, '<html lang="en"');
    }    
    case 'valid-lang': {
      return safeHtml.replace(/lang=["'][a-zA-Z0-9\-]+["']/i, 'lang="en"');
    }
    case 'duplicate-id': {
      return safeHtml.replace(/id=["']([^"']+)["']/i, 'id="$1-unique"');
    }
    case 'aria-allowed-attr':
    case 'aria-required-attr': {
      if (/aria-selected/i.test(safeHtml) && !/role=["']tab["']/i.test(safeHtml)) {
        return safeHtml.replace(/<button\b/i, '<button role="tab" aria-selected="false"');
      }
      return safeHtml.replace(/<([a-zA-Z0-9]+)\b/i, '<$1 aria-describedby="desc-id"');
    }
    case 'color-contrast': {
      if (/style=["']/i.test(safeHtml)) {
        if (/color:\s*[^;"]+/i.test(safeHtml)) {
          return safeHtml.replace(/color:\s*[^;"]+/, 'color: #1f2937');
        }
        return safeHtml.replace(/style=["']([^"]*)["']/, 'style="$1; color: #1f2937;"');
      }
      return safeHtml.replace(/<([a-zA-Z0-9]+)\b/, '<$1 style="color: #1a365d;"');
    }
    case 'meta-viewport': {
      return '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    }
    case 'empty-heading': {
      return safeHtml.replace(/<h([1-6])([^>]*)>\s*<\/h\1>/i, '<h$1$2>Section Title</h$1>');
    }
    case 'focus-visible': {
      return safeHtml.replace(/<([a-zA-Z0-9]+)\b/i, '<$1 class="focusable-element"');
    }
    case 'image-alt': {
      if (!/alt=/i.test(safeHtml)) {
        return safeHtml.replace(/<img\b/i, '<img alt="Descriptive image context"');
      }
      return safeHtml.replace(/alt=["']\s*["']/, 'alt="Descriptive image context"');
    }
    case 'area-alt': {
      if (!/alt=/i.test(safeHtml)) {
        return safeHtml.replace(/<area\b/i, '<area alt="Map navigation target"');
      }
      return safeHtml.replace(/alt=["']\s*["']/, 'alt="Map navigation target"');
    }
    case 'object-alt': {
      if (/<object\b[^>]*>/i.test(safeHtml)) {
        return safeHtml.replace(
          /(<object\b[^>]*>)/i,
          '$1\n  <p>Alternative content description for embedded object.</p>'
        );
      }
      return '<object>\n  <p>Alternative content description for embedded object.</p>\n  ' + safeHtml + '\n</object>';
    }    
    case 'video-caption': {
      if (/<video\b[^>]*>/i.test(safeHtml)) {
        return safeHtml.replace(
          /(<video\b[^>]*>)/i,
          '$1\n  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>'
        );
      }
      return '<video controls>\n  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>\n  ' + safeHtml + '\n</video>';
    }
    case 'audio-caption': {
      if (/<audio\b[^>]*>/i.test(safeHtml)) {
        return safeHtml.replace(
          /(<audio\b[^>]*>)/i,
          '$1\n  <track kind="captions" src="transcript.vtt" srclang="en" label="English">'
        );
      }
      return '<audio controls>\n  <track kind="captions" src="transcript.vtt" srclang="en" label="English">\n  ' + safeHtml + '\n</audio>';
    }    
    case 'blink': {
      return safeHtml.replace(/style=["']([^""]*)blink([^""]*)["']/gi, 'style="$1none$2"');
    }
    case 'label': {
      if (!/<label/i.test(safeHtml) && /<input\b/i.test(safeHtml)) {
        return '<label for="input-id">Input Label</label>\n' + safeHtml.replace(/<input\b/i, '<input id="input-id"');
      }
      return '<label>Label Title\n  ' + safeHtml + '\n</label>';
    }
    case 'label-title-only': {
      return safeHtml.replace(/aria-label=["']([^""]+)["']/i, 'aria-label="Matching Visible Label Text"');
    }
    case 'heading-order': {
      return safeHtml
        .replace(/<h[3-6]\b/i, '<h2')
        .replace(/<\/h[3-6]>/i, '</h2>');
    }
    case 'link-name': {
      if (safeHtml.includes('><')) {
        return safeHtml.replace('><', '>Read Full Content<');
      }
      return safeHtml.replace(/<a\b/i, '<a aria-label="Navigation target"');
    }
    case 'button-name': {
      if (!/aria-label/i.test(safeHtml)) {
        return safeHtml.replace(/<button\b/i, '<button aria-label="Action button"');
      }
      return safeHtml;
    }
    default:
      if (entry && entry.compliantCodeExample) {
        return entry.compliantCodeExample;
      }
      return safeHtml.replace(/>/, ' data-wcag-fix="' + ruleId + '">');
  }
}

export default { generateFixedSnippet };
