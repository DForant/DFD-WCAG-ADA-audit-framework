/**
 * normalizer.js - AST/DOM axe-core payload normalizer
 * Implements FR-DATA-01 through FR-DATA-03
 */
import fs from 'fs';
import path from 'path';

export function normalizeAxeResults(rawResults = {}) {
  const violations = Array.isArray(rawResults.violations) ? rawResults.violations : [];

  const summary = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: 0
  };

  const normalizedViolationsMap = new Map();

  for (const v of violations) {
    const impact = v.impact || 'moderate';
    if (summary[impact] !== undefined) {
      summary[impact] += 1;
    }
    summary.total += 1;

    const tags = Array.isArray(v.tags) ? v.tags : [];
    const wcagTags = tags.filter(t => t.startsWith('wcag') || t.startsWith('section508'));
    const wcag = wcagTags.length > 0 ? wcagTags.join(', ') : (tags[0] || 'unknown');

    const rawNodes = Array.isArray(v.nodes) ? v.nodes : [];
    const nodes = rawNodes.map(node => ({
      target: Array.isArray(node.target) ? node.target.join(' ') : (node.target || ''),
      html: node.html || '',
      failureSummary: node.failureSummary || ''
    }));

    const violationKey = `${v.id}-${impact}`;
    if (normalizedViolationsMap.has(violationKey)) {
      const existing = normalizedViolationsMap.get(violationKey);
      // Merge nodes while avoiding duplicates based on target + html
      const existingNodeKeys = new Set(existing.nodes.map(n => `${n.target}|${n.html}`));
      for (const node of nodes) {
        const nodeKey = `${node.target}|${node.html}`;
        if (!existingNodeKeys.has(nodeKey)) {
          existingNodeKeys.add(nodeKey);
          existing.nodes.push(node);
        }
      }
    } else {
      normalizedViolationsMap.set(violationKey, {
        id: v.id || 'unknown',
        impact: impact,
        wcag: wcag,
        description: v.description || '',
        helpUrl: v.helpUrl || '',
        nodes: nodes
      });
    }
  }

  const normalizedViolations = Array.from(normalizedViolationsMap.values());

  const normalized = {
    scanTarget: rawResults.url || rawResults.scanTarget || 'unknown',
    timestamp: rawResults.timestamp || new Date().toISOString(),
    summary,
    violations: normalizedViolations
  };

  try {
    const outputPath = path.resolve(process.cwd(), 'audit-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf8');
  } catch (err) {
    // Silently handle or fallback if file write restricted in certain environments
  }

  return normalized;
}

export default { normalizeAxeResults };
