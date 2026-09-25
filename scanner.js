/**
 * scanner.js - Playwright + axe-core accessibility scanner
 * Implements FR-SCAN-01 through FR-SCAN-05
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

export async function runScan(targetUrl) {
  let urlToScan = targetUrl;

  if (!urlToScan) {
    try {
      const targetsPath = path.resolve(process.cwd(), 'targets.json');
      if (fs.existsSync(targetsPath)) {
        const targetsData = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
        if (Array.isArray(targetsData) && targetsData.length > 0) {
          urlToScan = targetsData[0].url || targetsData[0];
        } else if (targetsData.url) {
          urlToScan = targetsData.url;
        }
      }
    } catch (err) {
      // Fallback if targets.json parsing fails
    }
  }

  if (!urlToScan) {
    urlToScan = process.argv[2] || 'http://localhost:3000';
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    await page.goto(urlToScan, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (err) {
    // If networkidle times out, attempt to proceed with whatever is loaded
  }

  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await browser.close();

  return {
    url: urlToScan,
    timestamp: new Date().toISOString(),
    violations: axeResults.violations || [],
    passes: axeResults.passes || [],
    incomplete: axeResults.incomplete || [],
    inapplicable: axeResults.inapplicable || []
  };
}

export default { runScan };
