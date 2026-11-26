import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

test('inaccessible-site fixture files and styles exist', () => {
  const dir = path.resolve('tests/fixtures/inaccessible-site');
  const files = ['index.html', 'about.html', 'contact.html', 'blog.html', 'styles.css'];

  for (const file of files) {
    const filePath = path.join(dir, file);
    assert.ok(fs.existsSync(filePath), `Fixture file should exist: ${file}`);
  }
});

test('inaccessible-site pages cross-link and reference stylesheet', () => {
  const dir = path.resolve('tests/fixtures/inaccessible-site');
  const htmlFiles = ['index.html', 'about.html', 'contact.html', 'blog.html'];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    assert.ok(content.includes('styles.css'), `${file} must reference styles.css`);
    assert.ok(content.includes('index.html'), `${file} must link to index.html`);
    assert.ok(content.includes('about.html'), `${file} must link to about.html`);
    assert.ok(content.includes('contact.html'), `${file} must link to contact.html`);
    assert.ok(content.includes('blog.html'), `${file} must link to blog.html`);
  }
});

test('inaccessible-site contains key deliberate WCAG anti-patterns', () => {
  const dir = path.resolve('tests/fixtures/inaccessible-site');
  const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const aboutHtml = fs.readFileSync(path.join(dir, 'about.html'), 'utf8');
  const contactHtml = fs.readFileSync(path.join(dir, 'contact.html'), 'utf8');
  const blogHtml = fs.readFileSync(path.join(dir, 'blog.html'), 'utf8');
  const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');

  // Language & metadata
  assert.ok(indexHtml.includes('<html lang="">') || indexHtml.includes('<html>'), 'index.html should omit or empty lang');
  assert.ok(aboutHtml.includes('lang="invalid-xyz"'), 'about.html should have invalid lang');
  assert.ok(blogHtml.includes('lang="12345"'), 'blog.html should have valid-lang trigger');

  // Styling & focus
  assert.ok(css.includes('outline: none !important'), 'styles.css should disable focus outline');
  assert.ok(css.includes('orientation: landscape'), 'styles.css should have orientation lock');
  assert.ok(indexHtml.includes('user-scalable=no'), 'Viewport meta should disable zoom');

  // Semantics & widgets
  assert.ok(aboutHtml.includes('<h4>'), 'about.html should skip heading levels');
  assert.ok(aboutHtml.includes('dup-section'), 'about.html should have duplicate IDs');
  assert.ok(contactHtml.includes('role="checkbox"'), 'contact.html should have aria role checkbox without aria-checked');
  assert.ok(indexHtml.includes('<button></button>'), 'index.html should have empty button');
  assert.ok(indexHtml.includes('<blink>'), 'index.html should have blink element');
});
