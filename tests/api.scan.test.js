import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../server/index.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { normalizeResults } from '../normalizer.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address();
      baseUrl = `http://localhost:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
});

test('Input Validation Test: POST /api/audit/scan with missing or empty targets returns 400', async () => {
  const res1 = await fetch(`${baseUrl}/api/audit/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(res1.status, 400);

  const res2 = await fetch(`${baseUrl}/api/audit/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targets: [] })
  });
  assert.strictEqual(res2.status, 400);
});

test('Local File Interception Test: Windows/POSIX local file paths convert cleanly to file:// URIs', () => {
  const samplePath = 'tests/unit/index.html';
  const absolutePath = path.resolve(process.cwd(), samplePath);
  const fileUrl = pathToFileURL(absolutePath).href;
  assert.ok(fileUrl.startsWith('file://'));
});

test('Baseline Validation Test: Send tests/unit/index.html and verify 200 with baseline failures', async () => {
  const res = await fetch(`${baseUrl}/api/audit/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targets: ['tests/unit/index.html']
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.timestamp);
  assert.ok(Array.isArray(data.results));
  assert.strictEqual(data.results.length, 1);

  const result = data.results[0];
  assert.strictEqual(result.status, 'success');
  assert.ok(result.violations.length > 0);

  const ruleIds = result.violations.map(v => v.ruleId);
  
  // Assert baseline failures are caught
  const expectedRules = ['document-title', 'html-has-lang', 'color-contrast', 'image-alt'];
  for (const expected of expectedRules) {
    assert.ok(ruleIds.includes(expected), `Expected rule ${expected} to be triggered in baseline test`);
  }
});

test('Partial Failure Resilience Test: Submit valid and invalid targets and assert resilience', async () => {
  const res = await fetch(`${baseUrl}/api/audit/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targets: ['tests/unit/index.html', 'https://nonexistent.invalid.domain']
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.results.length, 2);
  assert.strictEqual(data.results[0].status, 'success');
  assert.strictEqual(data.results[1].status, 'error');
  assert.ok(data.results[1].error);
});
