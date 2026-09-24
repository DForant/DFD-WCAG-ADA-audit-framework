/**
 * normalizer.js - AST/DOM axe-core payload normalizer
 */
export function normalizeAxeResults(rawResults = {}) {
  // Stub implementation adhering to PRD Section 7.2 schema
  return {
    scanTarget: rawResults.url || "unknown",
    timestamp: rawResults.timestamp || new Date().toISOString(),
    summary: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      total: 0
    },
    violations: []
  };
}

export default { normalizeAxeResults };