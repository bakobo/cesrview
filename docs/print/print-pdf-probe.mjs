import pw from '/home/daniel/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
import { readFileSync } from 'node:fs';
const { chromium } = pw;
const sample = readFileSync('/home/daniel/code/bakobo/cesrview/samples/multisig-oobi.cesr', 'utf8');

const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1500, height: 1000 } }).then(c => c.newPage());
await page.addInitScript(() => localStorage.setItem('cesrview-theme', 'light'));
await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
await page.getByLabel('CESR stream').fill(sample);
await page.waitForSelector('.cesr-rail .cesr-pill', { timeout: 15000 });
await page.locator('.toc-item').first().click();
await page.waitForTimeout(1000);

// horizontal-overflow audit (scrollWidth > clientWidth ⇒ content clipped on paper)
const overflow = await page.evaluate(() => {
  const sel = ['.cesr-source', '.cesr-center', '.cesr-rail', '.cesr-input'];
  const out = {};
  for (const s of sel) {
    const el = document.querySelector(s);
    if (!el) { out[s] = 'absent'; continue; }
    out[s] = { clientW: el.clientWidth, scrollW: el.scrollWidth, overflowPx: el.scrollWidth - el.clientWidth };
  }
  // widest single text node inside source (raw prettified) — longest unbroken run
  const src = document.querySelector('.cesr-source');
  out.longestSrcLine = src ? Math.max(0, ...[...src.querySelectorAll('*')].map(n => n.scrollWidth)) : null;
  return out;
});
console.log('OVERFLOW AUDIT (print media):');
console.log(JSON.stringify(overflow, null, 2));

await page.emulateMedia({ media: 'print' });
await page.pdf({ path: '/tmp/print-probe/current-letter.pdf', format: 'Letter', printBackground: true });
await browser.close();
console.log('pdf -> /tmp/print-probe/current-letter.pdf');
