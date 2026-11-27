import express from 'express';
import path from 'path';
import { pathToFileURL } from 'url';
import { runScan } from '../../scanner.js';
import { normalizeResults } from '../../normalizer.js';

const router = express.Router();

router.post('/scan', async (req, res) => {
  const { targets } = req.body || {};

  if (!targets || !Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({
      error: 'Invalid request: targets field is required and must be a non-empty array.'
    });
  }

  const timestamp = new Date().toISOString();
  const results = [];

  for (const targetInput of targets) {
    let resolvedTarget = targetInput;
    if (!resolvedTarget.startsWith('http://') && !resolvedTarget.startsWith('https://') && !resolvedTarget.startsWith('file://')) {
      const absolutePath = path.resolve(process.cwd(), resolvedTarget);
      resolvedTarget = pathToFileURL(absolutePath).href;
    } else if (!resolvedTarget.startsWith('file://') && path.isAbsolute(resolvedTarget)) {
      resolvedTarget = pathToFileURL(resolvedTarget).href;
    }

    try {
      const rawScan = await runScan(targetInput);
      const normalized = normalizeResults(rawScan);
      results.push({
        target: normalized.scanTarget,
        status: 'success',
        summary: {
          critical: normalized.summary.critical,
          serious: normalized.summary.serious,
          moderate: normalized.summary.moderate,
          minor: normalized.summary.minor
        },
        violations: normalized.violations
      });
    } catch (err) {
      results.push({
        target: resolvedTarget,
        status: 'error',
        error: err.message || 'Failed to scan target'
      });
    }
  }

  return res.status(200).json({
    timestamp,
    results
  });
});

export default router;
