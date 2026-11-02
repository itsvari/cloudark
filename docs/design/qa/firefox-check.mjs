/* global process, console, document, innerWidth, getComputedStyle */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { firefox } = await import(pathToFileURL(resolve(process.argv[2], 'index.mjs')).href);
(async () => {
  const browser = await firefox.launch({ headless: true });
  const results = [];
  for (const width of [390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 800 } });
    const responses = [];
    page.on('response', response => { if (/\.(woff2|svg)(\?|$)/.test(response.url())) responses.push({ url: response.url(), status: response.status() }); });
    await page.goto('http://127.0.0.1:4322/gigs', { waitUntil: 'networkidle' });
    const result = await page.evaluate(async () => {
      await document.fonts.ready;
      const photo = document.querySelector('.photo-fill');
      const nav = document.querySelector('header nav');
      const menu = document.querySelector('header summary');
      return {
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        fonts: [...document.fonts].map(font => ({ family: font.family, status: font.status })),
        mask: photo ? getComputedStyle(photo).maskImage : null,
        webkitMask: photo ? getComputedStyle(photo).webkitMaskImage : null,
        menuDisplay: menu ? getComputedStyle(menu).display : null,
        navDisplay: nav ? getComputedStyle(nav).display : null,
        columns: getComputedStyle(document.querySelector('main')).gridTemplateColumns
      };
    });
    await page.screenshot({ path: `docs/design/qa/firefox-gigs-${width}.png` });
    results.push({ ...result, responses });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
