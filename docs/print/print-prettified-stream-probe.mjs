import pw from '/home/daniel/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
import { readFileSync } from 'node:fs';
const { chromium } = pw;
const sample = readFileSync('/home/daniel/code/bakobo/cesrview/samples/multisig-oobi.cesr', 'utf8');

const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1500, height: 1000 } }).then(c => c.newPage());
await page.addInitScript(() => localStorage.setItem('cesrview-theme', 'light'));
await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
await page.getByLabel('CESR stream').fill(sample);
await page.waitForSelector('.cesr-source-line', { timeout: 15000 });

// Minimal TRANSCRIPT-scope print stylesheet: un-column, release source to full page width, wrap long values.
await page.addStyleTag({ content: `
@page { size: Letter; margin: 0.6in; }
@media print {
  html[data-print-scope="transcript"] .cesr-main { display: block !important; }
  html[data-print-scope="transcript"] .cesr-center,
  html[data-print-scope="transcript"] .cesr-rail,
  html[data-print-scope="transcript"] .cesr-input-panel textarea { display: none !important; }
  html[data-print-scope="transcript"] .cesr-input-panel,
  html[data-print-scope="transcript"] .cesr-source {
    width: auto !important; max-width: none !important; overflow: visible !important; height: auto !important;
  }
  html[data-print-scope="transcript"] .cesr-source-line code {
    white-space: pre-wrap !important; overflow-wrap: anywhere !important;
  }
}
`});
await page.evaluate(() => document.documentElement.setAttribute('data-print-scope', 'transcript'));
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(400);
await page.pdf({ path: '/tmp/print-probe/transcript-letter.pdf', format: 'Letter', printBackground: true, margin: { top:'0.6in', bottom:'0.6in', left:'0.6in', right:'0.6in' } });
await browser.close();
console.log('pdf -> /tmp/print-probe/transcript-letter.pdf');
