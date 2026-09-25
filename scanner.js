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

  // 1. Resolve URL from CLI argument or targets.json if not passed directly
  if (!urlToScan) {
    try {
      const targetsPath = path.resolve(process.cwd(), 'targets.json');
      if (fs.existsSync(targetsPath)) {
        const rawJson = fs.readFileSync(targetsPath, 'utf8');
        const parsed = JSON.parse(rawJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          urlToScan = parsed[0].url || parsed[0];
        } else if (Array.isArray(parsed.targets) && parsed.targets.length > 0) {
          urlToScan = parsed.targets[0].url || parsed.targets[0];
        } else if (parsed.url) {
          urlToScan = parsed.url;
        }
      }
    } catch (err) {
      console.warn(`[scanner] Failed to read targets.json: ${err.message}`);
    }
  }

  // 2. Final fallbacks
  if (!urlToScan) {
    urlToScan = process.argv[2] || 'https://deanforantdesigns.com';
  }

  console.log(`[scanner] Initiating scan for: ${urlToScan}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Navigate with a resilient load strategy
    await page.goto(urlToScan, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error(`[scanner] Fatal navigation error to ${urlToScan}: ${err.message}`);
    await browser.close();
    throw new Error(`Failed to navigate to target URL: ${urlToScan} (${err.message})`);
  }

  // Run Axe after page stabilization
  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const finalUrl = page.url();
  await browser.close();

  return {
    url: finalUrl || urlToScan,
    timestamp: new Date().toISOString(),
    violations: axeResults.violations || [],
    passes: axeResults.passes || [],
    incomplete: axeResults.incomplete || [],
    inapplicable: axeResults.inapplicable || []
  };
}

export default { runScan };