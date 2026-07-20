/*
 * print-validate.mjs — OBJECTIVE oracle for the shipped @media print CSS (decisions 3p4cnyq7 /
 * p9rn5t). Unlike the exploration probes here, it injects NO CSS: it drives the real app through
 * the header Print menu and asserts computed styles + line counts per scope (no PII PDF needed).
 *
 * Prereqs: `npm run build` then serve dist on :5175 (`npx vite preview --port 5175`); Playwright +
 * chromium available; samples/multisig-oobi.cesr present (gitignored, local-only). Exit 0 = all pass.
 */
import pw from '/home/daniel/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
import { readFileSync } from 'node:fs';
const { chromium } = pw;
const sample = readFileSync('/home/daniel/code/bakobo/cesrview/samples/multisig-oobi.cesr', 'utf8');
const URL = 'http://localhost:5175/';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });

async function withScope(scope, menuLabel) {
  const page = await ctx.newPage();
  // Force DARK theme so we prove the print stylesheet overrides it to the paper palette.
  await page.addInitScript(() => {
    localStorage.setItem('cesrview-theme', 'dark');
    window.print = () => {}; // no dialog in headless; the expand side-effect still runs
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.getByLabel('CESR stream').fill(sample);
  await page.waitForSelector('.cesr-source-line');
  const before = await page.locator('.cesr-source-line').count();
  // Trigger the REAL app path: header Print menu -> scope.
  await page.getByRole('button', { name: /print/i }).click();
  await page.getByRole('menuitem', { name: menuLabel }).click();
  if (scope === 'transcript') await page.waitForSelector('.list-more', { state: 'detached' });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const disp = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).display : 'MISSING'; };
    const src = document.querySelector('.cesr-source');
    const brk = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).breakInside : 'MISSING'; };
    return {
      scope: document.documentElement.getAttribute('data-print-scope'),
      inputDisplay: disp('.cesr-input-panel'),
      railDisplay: disp('.cesr-rail'),
      centerDisplay: disp('.cesr-center'),
      lines: document.querySelectorAll('.cesr-source-line').length,
      hasMore: !!document.querySelector('.list-more'),
      sourceOverflowX: src ? src.scrollWidth - src.clientWidth : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      eventBreakInside: brk('.cesr-event'),
      rowBreakInside: brk('.row'),
    };
  });
  await page.close();
  return { before, ...r };
}

const t = await withScope('transcript', /transcript/i);
const m = await withScope('manifest', /manifest/i);
const e = await withScope('exhibit', /this event/i);
await browser.close();

const checks = [
  ['transcript: scope attr set', t.scope === 'transcript'],
  ['transcript: expanded ALL lines (fail-closed) — grew past first chunk', t.lines > t.before && t.before <= 80],
  ['transcript: no "more" sentinel after expand', t.hasMore === false],
  ['transcript: manifest + exhibit hidden', t.railDisplay === 'none' && t.centerDisplay === 'none'],
  ['transcript: source has no horizontal overflow (wraps)', t.sourceOverflowX !== null && t.sourceOverflowX <= 2],
  ['transcript: paper palette forced under dark theme', /rgb\(255, 255, 255\)/.test(t.bodyBg)],
  ['manifest: transcript + exhibit hidden', m.inputDisplay === 'none' && m.centerDisplay === 'none'],
  ['manifest: rail visible', m.railDisplay !== 'none' && m.railDisplay !== 'MISSING'],
  ['exhibit: transcript + manifest hidden', e.inputDisplay === 'none' && e.railDisplay === 'none'],
  ['exhibit: center visible', e.centerDisplay !== 'none' && e.centerDisplay !== 'MISSING'],
  ['exhibit: event card is NOT break-inside:avoid (no blank page 1)', e.eventBreakInside !== 'avoid'],
  ['exhibit: field rows ARE break-inside:avoid (rows never split)', e.rowBreakInside === 'avoid'],
];
let ok = true;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`); if (!pass) ok = false; }
console.log(`\nbefore-expand lines (transcript first chunk)=${t.before}, after=${t.lines}; bodyBg(print,darktheme)=${t.bodyBg}`);
console.log(ok ? '\nALL PRINT-CSS CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(ok ? 0 : 1);
