/* global document, window, innerHeight, innerWidth, sessionStorage, getComputedStyle, location */
import assert from 'node:assert/strict';
import console from 'node:console';
import process from 'node:process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const playwrightDirectory = process.argv[2];
if (!playwrightDirectory) throw new Error('Pass the directory of an installed Playwright package.');
const { chromium } = await import(pathToFileURL(resolve(playwrightDirectory, 'index.mjs')).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const results = {};
async function check(name, run) {
  try { results[name] = { status: 'passed', detail: await run() }; }
  catch (error) { results[name] = { status: 'failed', error: error.stack }; process.exitCode = 1; }
}
async function setup(widthPx, heightPx) {
  const context = await browser.newContext({ viewport: { width: widthPx, height: heightPx }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setDeviceMetricsOverride', { width: widthPx, height: heightPx, deviceScaleFactor: 1, mobile: true });
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  return { context, page, session };
}
async function touch(session, type, x, y) {
  await session.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }] });
}
try {
  for (const [site, port, desktopWidthPx] of [['personal', 4431, 640], ['v4ri', 4432, 1024]]) {
    for (const method of ['close', 'escape', 'resize']) {
      await check(`${site} drawer ${method}`, async () => {
        const widthPx = site === 'v4ri' ? 640 : 390;
        const { context, page, session } = await setup(widthPx, 390);
        try {
          await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
          await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 500); document.body.focus(); });
          const before = await page.evaluate(() => window.scrollY);
          assert.ok(before > 0, `scroll position ${before}`);
          await page.evaluate(() => document.querySelector('[data-drawer-trigger]').click());
          await page.waitForSelector('dialog[open]');
          const locked = await page.evaluate(() => ({ top: document.body.style.top, active: document.activeElement.className, height: innerHeight, width: innerWidth }));
          assert.equal(locked.top, `${-before}px`);
          await page.evaluate(() => { document.querySelector('main').setAttribute('tabindex', '-1'); document.querySelector('main').focus(); });
          assert.equal(await page.evaluate(() => document.activeElement.closest('dialog') !== null), true);
          const nav = page.locator('dialog nav');
          const scroll = await nav.evaluate(element => { const before = element.scrollTop; element.scrollTop = 100; return { before, after: element.scrollTop, height: element.clientHeight, total: element.scrollHeight }; });
          assert.ok(scroll.after > scroll.before, JSON.stringify(scroll));
          const close = page.locator('.drawer-close');
          const box = await close.boundingBox();
          assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= widthPx && box.y + box.height <= 390 && box.width >= 48 && box.height >= 48, JSON.stringify(box));
          if (method === 'close') await close.click();
          if (method === 'escape') await page.keyboard.press('Escape');
          if (method === 'resize') await session.send('Emulation.setDeviceMetricsOverride', { width: desktopWidthPx, height: 390, deviceScaleFactor: 1, mobile: true });
          await page.waitForFunction(() => !document.querySelector('dialog').open);
          await page.waitForTimeout(100);
          const after = await page.evaluate(() => ({ y: window.scrollY, maxY: document.documentElement.scrollHeight - innerHeight, position: document.body.style.position, focusedTrigger: document.activeElement.matches('[data-drawer-trigger]') }));
          assert.equal(after.y, method === 'resize' ? Math.min(before, after.maxY) : before);
          assert.notEqual(after.position, 'fixed');
          if (method !== 'resize') assert.equal(after.focusedTrigger, true);
          return { before, locked, scroll, box, after };
        } finally { await context.close(); }
      });
    }
  }
  for (const gesture of ['tap', 'cancel', 'scroll']) {
    await check(`v4ri photo ${gesture}`, async () => {
      const { context, page, session } = await setup(390, 844);
      try {
        await page.goto('http://127.0.0.1:4432/gigs', { waitUntil: 'load' });
        const link = page.locator('[data-photo-row] a').first();
        await link.scrollIntoViewIfNeeded();
        const href = await link.evaluate(element => element.href);
        await page.evaluate(() => { window.qaClicks = []; sessionStorage.removeItem('qaClicks'); window.addEventListener('click', event => { window.qaClicks.push({ prevented: event.defaultPrevented, href: event.target.closest('a')?.href }); sessionStorage.setItem('qaClicks', JSON.stringify(window.qaClicks)); }); });
        const box = await link.boundingBox();
        assert.ok(box);
        const startY = await page.evaluate(() => window.scrollY);
        const x = box.x + Math.min(box.width / 2, 80), y = box.y + box.height / 2;
        await touch(session, 'touchStart', x, y);
        await page.waitForTimeout(80);
        const pressed = await link.evaluate(element => ({ pressed: element.closest('[data-photo-row]').hasAttribute('data-photo-pressed'), filter: getComputedStyle(element.closest('[data-photo-row]').querySelector('.photo-fill')).filter }));
        assert.deepEqual(pressed, { pressed: true, filter: 'none' });
        if (gesture === 'tap') {
          const navigation = page.waitForURL(href);
          await touch(session, 'touchEnd', x, y);
          await navigation;
          const clicks = await page.evaluate(() => JSON.parse(sessionStorage.getItem('qaClicks')));
          assert.deepEqual(clicks, [{ prevented: false, href }]);
          return { href, url: page.url(), pressed, clicks };
        }
        if (gesture === 'cancel') await touch(session, 'touchCancel', x, y);
        else { await touch(session, 'touchMove', x, Math.max(5, y - 150)); await touch(session, 'touchEnd', x, y - 150); }
        await page.waitForTimeout(200);
        const after = await page.evaluate(() => ({ pressed: !!document.querySelector('[data-photo-pressed]'), clicks: window.qaClicks, url: location.href, y: window.scrollY }));
        assert.equal(after.pressed, false);
        if (gesture === 'scroll') assert.ok(after.y > startY, JSON.stringify({ startY, after }));
        assert.equal(after.clicks.length, 0);
        assert.equal(after.url, 'http://127.0.0.1:4432/gigs');
        return { pressed, after };
      } finally { await context.close(); }
    });
  }
} finally {
  await browser.close();
  writeFileSync('/tmp/cloudark-mobile-interactions-results.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
}
