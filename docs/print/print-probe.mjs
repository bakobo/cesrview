import pw from '/home/daniel/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
import { readFileSync, mkdirSync } from 'node:fs';
const { chromium } = pw;

const OUT = '/tmp/print-probe';
mkdirSync(OUT, { recursive: true });
const sample = readFileSync('/home/daniel/code/bakobo/cesrview/samples/multisig-oobi.cesr', 'utf8');

const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 }).then(c => c.newPage());
// paper = white: seed the stored theme BEFORE the app mounts so ThemeToggle keeps it
await page.addInitScript(() => localStorage.setItem('cesrview-theme', 'light'));
await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
await page.getByLabel('CESR stream').fill(sample);
// let decode + entviz canvas draws settle
await page.waitForSelector('.cesr-rail .cesr-pill', { timeout: 15000 });
await page.waitForTimeout(1500);

const shots = async (tag) => {
  const rail = page.locator('.cesr-rail');
  await rail.screenshot({ path: `${OUT}/manifest-${tag}.png` });
  const ids = page.locator('.rail-ids');
  if (await ids.count()) await ids.screenshot({ path: `${OUT}/identifiers-${tag}.png` });
  // select first event → DecodedEvent in centre
  await page.locator('.toc-item').first().click();
  await page.waitForTimeout(600);
  const centre = page.locator('.cesr-center');
  if (await centre.count()) await centre.screenshot({ path: `${OUT}/decoded-${tag}.png` });
};

await shots('color');
// simulate B/W laser print
await page.addStyleTag({ content: 'html{filter:grayscale(1) !important}' });
await shots('gray');
// simulate a harsher photocopier (crushed midtones)
await page.addStyleTag({ content: 'html{filter:grayscale(1) contrast(1.5) brightness(1.05) !important}' });
await shots('gray-harsh');

await browser.close();
console.log('done -> ' + OUT);
