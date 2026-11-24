/* global document, window, innerHeight, innerWidth, getComputedStyle, location, matchMedia, PerformanceObserver, URL */
// verifies the interaction layer described in docs/design/design-guide.md §6 against two running sites.
// usage: node docs/design/qa/motion-check.mjs /path/to/playwright [itsvari-base-url] [v4ri-base-url]
import assert from 'node:assert/strict';
import console from 'node:console';
import process from 'node:process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const playwrightDirectory = process.argv[2];
if (!playwrightDirectory) throw new Error('Pass the directory of an installed Playwright package.');
const sites = { itsvari: process.argv[3] ?? 'http://127.0.0.1:4321', v4ri: process.argv[4] ?? 'http://127.0.0.1:4322' };
const playwright = await import(pathToFileURL(resolve(playwrightDirectory, 'index.mjs')).href);
const browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });

const pages = {
  itsvari: ['/', '/projects', '/projects/markwire', '/cv', '/about', '/contact', '/blog', '/activity'],
  v4ri: ['/', '/gigs', '/gigs/blacklight-rave-xvi-nosferavetu', '/releases', '/about', '/contact', '/socials', '/posts'],
};
const widthsPx = [390, 768, 1280, 2560];
const minimumTargetPx = 44;
const targetTolerancePx = 0.5;
const maximumLoadShift = 0.01;
const maximumHoverShift = 0.001;
const hoverTargetLimit = 14;
const concurrency = 6;
const motionTokens = ['--motion-press-ms', '--motion-hover-ms', '--motion-select-ms', '--motion-page-ms', '--motion-signature-ms'];
const results = {};

async function check(name, run) {
  try { results[name] = { status: 'passed', detail: await run() }; }
  catch (error) { results[name] = { status: 'failed', error: error.stack }; process.exitCode = 1; }
  console.log(`${results[name].status.padEnd(6)} ${name}`);
}

async function open({ widthPx = 1280, heightPx = 900, reducedMotion = 'no-preference', touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width: widthPx, height: heightPx }, reducedMotion, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  // a development server adds its own toolbar, which is not part of either site and shifts as the pointer nears it.
  await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = 'astro-dev-toolbar { display: none !important; }';
    document.head.append(style);
  }));
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => { if (message.type() === 'error' && !servedFromAnotherOrigin(message)) problems.push(message.text()); });
  page.on('pageerror', (error) => problems.push(error.message));
  return { context, page, problems };
}

// a production build served locally asks two hosts that only answer the real sites: the licensed font host and the
// analytics beacon. their refusals say nothing about the build, so they are set aside; every other error still counts.
function servedFromAnotherOrigin(message) {
  const refused = [message.location().url, message.text()].join(' ');
  return /https:\/\/media\.itsvari\.com\/fonts\/|https:\/\/(static\.)?cloudflareinsights\.com\//.test(refused);
}

// freezes a cross-document view transition as it starts and records which elements it paired.
async function watchTransitions(context) {
  await context.addInitScript(() => {
    window.addEventListener('pagereveal', (event) => {
      window.__transition = { present: Boolean(event.viewTransition), settled: !event.viewTransition };
      event.viewTransition?.ready.then(() => {
        const animations = document.getAnimations().filter((animation) => animation.effect?.pseudoElement?.startsWith('::view-transition'));
        const pseudoElements = animations.map((animation) => animation.effect.pseudoElement);
        const named = (kind) => pseudoElements.filter((pseudo) => pseudo.startsWith(`::view-transition-${kind}(`)).map((pseudo) => pseudo.slice(pseudo.indexOf('(') + 1, -1));
        window.__transition.paired = named('old').filter((name) => named('new').includes(name));
        window.__transition.names = [...new Set([...named('group'), ...named('old'), ...named('new')])];
        window.__transition.settled = true;
      });
    });
  });
}

async function navigate(page, selector) {
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click(selector)]);
  await page.waitForFunction(() => window.__transition?.settled, null, { timeout: 8000 });
  return page.evaluate(() => ({ path: location.pathname + location.search, ...window.__transition }));
}

try {
  await check('sweep: no errors, overflow, layout shift, unprompted motion or duplicate transition names', async () => {
    const jobs = Object.keys(sites).flatMap((site) => widthsPx.flatMap((widthPx) => pages[site].map((path) => ({ site, widthPx, path }))));
    const failures = [];
    let worstLoadShift = 0;
    async function run({ site, widthPx, path }) {
      const { context, page, problems } = await open({ widthPx, heightPx: widthPx < 700 ? 844 : 900 });
      try {
        await context.addInitScript(() => {
          window.__layoutShift = 0;
          new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__layoutShift += entry.value; }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(`${sites[site]}${path}`, { waitUntil: 'load' });
        await page.waitForTimeout(700);
        const loaded = await page.evaluate(() => {
          const names = [...document.querySelectorAll('*')].flatMap((element) => [getComputedStyle(element).viewTransitionName, getComputedStyle(element, '::before').viewTransitionName]).filter((name) => name && name !== 'none');
          return {
            shift: window.__layoutShift,
            overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            duplicateNames: names.filter((name, index) => names.indexOf(name) !== index),
            // the carousel's progress line is a meter the visitor can stop; nothing else may be moving on a page at rest.
            unprompted: document.getAnimations().filter((animation) => animation.playState === 'running' && !animation.effect?.target?.matches?.('[data-slide-progress]')).length,
          };
        });
        const targets = await page.evaluate((limit) => [...document.querySelectorAll('main a, main button, .card, .ledger-row, .i-nav a, .v-nav a, .logo, .i-brand')]
          .map((element) => element.getBoundingClientRect())
          .filter((box) => box.width > 0 && box.height > 0 && box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth)
          .slice(0, limit).map((box) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 })), hoverTargetLimit);
        for (const target of targets) { await page.mouse.move(target.x, target.y); await page.waitForTimeout(70); }
        await page.mouse.move(1, 1);
        await page.waitForTimeout(400);
        const hoverShift = await page.evaluate(() => window.__layoutShift) - loaded.shift;
        worstLoadShift = Math.max(worstLoadShift, loaded.shift);
        const failed = problems.length > 0 || loaded.overflowPx > 0 || loaded.shift > maximumLoadShift || hoverShift > maximumHoverShift || loaded.unprompted > 0 || loaded.duplicateNames.length > 0;
        if (failed) failures.push({ site, widthPx, path, ...loaded, hoverShift, problems });
      } finally { await context.close(); }
    }
    const queue = [...jobs];
    await Promise.all(Array.from({ length: concurrency }, async () => { while (queue.length) await run(queue.shift()); }));
    assert.deepEqual(failures, []);
    return { pageLoads: jobs.length, worstLoadShift };
  });

  for (const site of Object.keys(sites)) {
    await check(`${site}: reduced motion is fully static`, async () => {
      const { context, page, problems } = await open({ reducedMotion: 'reduce' });
      try {
        await context.addInitScript(() => window.addEventListener('pagereveal', (event) => { window.__revealedWithTransition = Boolean(event.viewTransition); }));
        await page.goto(`${sites[site]}/`, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        const tokens = await page.evaluate((names) => {
          const probe = document.body.appendChild(document.createElement('i'));
          const values = names.map((name) => { probe.style.marginLeft = `calc(var(${name}) / 1ms * 1px)`; return getComputedStyle(probe).marginLeft; });
          probe.remove();
          return [...new Set(values)];
        }, motionTokens);
        assert.deepEqual(tokens, ['0px']);
        await page.locator(site === 'v4ri' ? '.hero-links a' : '.l-links a').first().hover();
        await page.waitForTimeout(80);
        const running = () => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length);
        assert.equal(await running(), 0, 'hover must not start an animation');
        const detail = { tokens };
        if (site === 'v4ri') {
          const index = () => page.textContent('[data-carousel-index]');
          const before = await index();
          await page.waitForTimeout(4600);
          assert.equal(await index(), before, 'the carousel must not advance by itself');
          await page.click('[data-slide-index="2"]');
          await page.waitForTimeout(80);
          assert.equal(await index(), '03', 'manual selection must still work');
          assert.equal(await running(), 0, 'manual selection must apply at once');
          detail.carousel = 'static until selected';
        }
        await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click(site === 'v4ri' ? '.v-nav a[href="/gigs"]' : '.i-nav a[href="/projects"]')]);
        // a small static page can finish loading before its first frame, which is when the reveal is reported.
        await page.waitForFunction(() => window.__revealedWithTransition !== undefined, null, { timeout: 8000 });
        assert.equal(await page.evaluate(() => window.__revealedWithTransition), false, 'page changes must be ordinary navigations');
        assert.deepEqual(problems, []);
        return detail;
      } finally { await context.close(); }
    });

    await check(`${site}: keyboard focus shows the hover treatment as well as an outline`, async () => {
      const { context, page, problems } = await open();
      try {
        await page.goto(`${sites[site]}/`, { waitUntil: 'load' });
        await page.waitForTimeout(400);
        const focused = [];
        // the skip link comes first; the three stops after it are the brand mark and the first navigation entries.
        for (let stop = 0; stop < 4; stop += 1) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(260);
          focused.push(await page.evaluate(() => {
            const element = document.activeElement;
            const style = getComputedStyle(element);
            const line = element.matches('.i-nav a') ? getComputedStyle(element, '::after').scale : element.matches('.i-brand, .logo') ? getComputedStyle(element.querySelector('.brand-name, span')).backgroundSize : style.backgroundSize;
            return { element: `${element.tagName.toLowerCase()}.${String(element.className).trim().split(/\s+/).join('.')}`, engaged: style.getPropertyValue('--engaged').trim(), outline: `${style.outlineStyle} ${style.outlineWidth}`, line };
          }));
        }
        for (const stop of focused) {
          assert.equal(stop.engaged, '1', `${stop.element} must be engaged while focused`);
          assert.equal(stop.outline, 'solid 1px', `${stop.element} must keep its focus outline`);
        }
        // a row reports its line as a scale, which serialises to a single 1 when both axes match; a label reports a background size.
        for (const stop of focused.slice(1)) assert.match(stop.line, /^(1( 1)?$|100% )/, `${stop.element} must draw its hairline in full`);
        assert.deepEqual(problems, []);
        return focused;
      } finally { await context.close(); }
    });

    await check(`${site}: touch has no sticky hover, a visible press and a first-tap navigation`, async () => {
      const { context, page, problems } = await open({ widthPx: 390, heightPx: 844, touch: true });
      try {
        await page.goto(`${sites[site]}${site === 'v4ri' ? '/gigs' : '/projects'}`, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        const container = site === 'v4ri' ? '.ledger-row' : '.card';
        assert.equal(await page.evaluate(() => matchMedia('(hover: hover)').matches), false);
        const box = await page.locator(container).first().boundingBox();
        const session = await context.newCDPSession(page);
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }] });
        await page.waitForTimeout(120);
        const held = await page.evaluate((selector) => {
          const style = getComputedStyle(document.querySelector(selector));
          return { engaged: style.getPropertyValue('--engaged').trim(), pressed: style.getPropertyValue('--pressed').trim(), tone: style.backgroundImage.startsWith('url(') };
        }, container);
        assert.deepEqual(held, { engaged: '0', pressed: '1', tone: true });
        const start = page.url();
        await Promise.all([page.waitForURL((url) => url.href !== start, { timeout: 5000 }), session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })]);
        assert.deepEqual(problems, []);
        return { held, landed: new URL(page.url()).pathname };
      } finally { await context.close(); }
    });

    await check(`${site}: touch targets are at least ${minimumTargetPx}px`, async () => {
      const undersized = [];
      let measured = 0;
      for (const [widthPx, heightPx] of [[390, 844], [768, 1024], [1024, 768]]) {
        for (const path of pages[site]) {
          const { context, page } = await open({ widthPx, heightPx, touch: true });
          try {
            await page.goto(`${sites[site]}${path}`, { waitUntil: 'load' });
            await page.waitForTimeout(400);
            const report = await page.evaluate(({ minimumPx, tolerancePx }) => {
              const describe = (element) => `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().split(/\s+/).join('.')}` : ''} "${element.textContent.trim().slice(0, 28)}"`;
              // a link in article prose keeps the height of its line: stretching it would cover the lines above and below.
              // bracketed labels and links given a target of their own are measured like everything else.
              const proseLink = (element) => Boolean(element.closest('.prose')) && !element.matches('a.tag, .tag a, .cv-resume p > a[href^="/projects"]:only-child');
              const candidates = [...document.querySelectorAll('a, button, summary')].filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden' && !proseLink(element));
              const failures = candidates.flatMap((element) => {
                // a stretched link is pressed through the card or row it covers.
                const surface = element.matches('.card h3 a, .ledger-row .title a') ? element.closest('.card, .ledger-row') : element;
                const box = surface.getBoundingClientRect();
                // some targets borrow their last few pixels through a transparent layer that reaches past their own box.
                const reach = getComputedStyle(surface, '::before');
                const borrowed = (side) => reach.position === 'absolute' && reach.content !== 'none' ? Math.max(0, -Number.parseFloat(reach[side])) || 0 : 0;
                const widthPx = box.width + borrowed('left') + borrowed('right');
                const heightPx = box.height + borrowed('top') + borrowed('bottom');
                return widthPx + tolerancePx < minimumPx || heightPx + tolerancePx < minimumPx ? [`${describe(element)} ${Math.round(widthPx)}x${Math.round(heightPx)}`] : [];
              });
              return { count: candidates.length, failures };
            }, { minimumPx: minimumTargetPx, tolerancePx: targetTolerancePx });
            measured += report.count;
            undersized.push(...report.failures.map((failure) => `${widthPx}px ${path} ${failure}`));
          } finally { await context.close(); }
        }
      }
      assert.deepEqual(undersized, []);
      return { measured };
    });
  }

  const journeys = [
    ['itsvari: the chrome holds and the marker and rule travel', 'itsvari', '/', '.i-nav a[href="/projects"]', ['site-chrome', 'navigation-marker']],
    ['itsvari: a card title scales into its page heading', 'itsvari', '/projects', '.card h3 a[href="/projects/markwire"]', ['card-title-projects-markwire', 'page-rule']],
    ['itsvari: the heading scales back into its card', 'itsvari', '/projects/markwire', '.reading-links a[href="/projects"]', ['card-title-projects-markwire', 'page-rule']],
    ['itsvari: a ledger title travels to the heading anchor', 'itsvari', '/activity', '.ledger-row .title a[href="/projects/markwire"]', ['ledger-title-projects-markwire']],
    ['v4ri: a gig title travels to the heading anchor and the rule glides', 'v4ri', '/gigs', '.ledger-row .title a[href="/gigs/blacklight-rave-xvi-nosferavetu"]', ['ledger-title-gigs-blacklight-rave-xvi-nosferavetu', 'page-rule', 'site-chrome']],
    ['v4ri: the gig title travels back to its row', 'v4ri', '/gigs/blacklight-rave-xvi-nosferavetu', '.reading-meta a[href="/gigs"]', ['ledger-title-gigs-blacklight-rave-xvi-nosferavetu', 'page-rule']],
    ['v4ri: a filter carries the remaining rows to their places', 'v4ri', '/gigs', '.filters a[href="/gigs?filter=recorded"]', ['ledger-row-gigs-blacklight-rave-xvi-nosferavetu', 'ledger-row-gigs-blacklight-sessions-02']],
  ];
  for (const [name, site, path, selector, expectedPairs] of journeys) {
    await check(`transition, ${name}`, async () => {
      const { context, page, problems } = await open({ heightPx: 800 });
      try {
        await watchTransitions(context);
        await page.goto(`${sites[site]}${path}`, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        const transition = await navigate(page, selector);
        assert.equal(transition.present, true, 'the navigation must run as a view transition');
        for (const pair of expectedPairs) assert.ok(transition.paired.includes(pair), `${pair} must pair across the two pages; paired: ${transition.paired.join(', ')}`);
        assert.ok(!transition.names.some((groupName) => groupName.includes('poster')), 'posters stay inside the page');
        assert.deepEqual(problems, []);
        return { path: transition.path, paired: transition.paired };
      } finally { await context.close(); }
    });
  }

  await check('v4ri: the carousel resolves through dither and never animates on load', async () => {
    const { context, page, problems } = await open({ heightPx: 800 });
    try {
      await page.goto(`${sites.v4ri}/`, { waitUntil: 'load' });
      await page.waitForTimeout(700);
      const atRest = await page.evaluate(() => ({ scanlines: document.querySelectorAll('.carousel .scan').length, animating: document.querySelector('.carousel-photo.is-current').getAnimations().length }));
      assert.deepEqual(atRest, { scanlines: 0, animating: 0 });
      const dissolve = await page.evaluate(() => {
        document.querySelector('[data-slide-index="1"]').click();
        void document.documentElement.offsetWidth;
        const photo = document.querySelector('.carousel-photo.is-current');
        const animation = photo.getAnimations().find((candidate) => candidate.animationName === 'dither-resolve');
        animation.pause();
        const timing = animation.effect.getComputedTiming();
        const levels = [];
        for (let timeMs = 0; timeMs <= timing.duration; timeMs += 60) { animation.currentTime = timeMs; levels.push(Number(getComputedStyle(photo).getPropertyValue('--dither-level'))); }
        animation.finish();
        return { durationMs: timing.duration, easing: timing.easing, levels, index: document.querySelector('[data-carousel-index]').textContent, previousVisible: getComputedStyle(document.querySelector('.carousel-photo.is-previous')).opacity };
      });
      assert.equal(dissolve.durationMs, 480);
      assert.equal(dissolve.easing, 'linear');
      assert.equal(dissolve.levels[0], 1, 'the first cells land at once');
      assert.equal(dissolve.levels.at(-1), 16);
      assert.deepEqual(dissolve.levels, [...dissolve.levels].sort((left, right) => left - right), 'the dissolve only ever adds cells');
      assert.deepEqual({ index: dissolve.index, previousVisible: dissolve.previousVisible }, { index: '02', previousVisible: '1' });
      assert.deepEqual(problems, []);
      return dissolve;
    } finally { await context.close(); }
  });

  await check('v4ri: a photo row reveals colour through the dither on hover and at once on touch', async () => {
    const { context, page, problems } = await open({ heightPx: 800 });
    try {
      await page.goto(`${sites.v4ri}/gigs`, { waitUntil: 'load' });
      await page.waitForTimeout(700);
      const row = page.locator('.ledger-row.hasbg').first();
      const level = () => row.evaluate((element) => getComputedStyle(element.querySelector('.photo-fill'), '::before').getPropertyValue('--dither-level'));
      assert.equal(await level(), '16', 'a photograph is greyscale at rest');
      await row.hover({ position: { x: 300, y: 10 } });
      const transitions = await page.evaluate(() => document.getAnimations().filter((animation) => animation.transitionProperty === '--dither-level').map((animation) => animation.effect.getComputedTiming().duration));
      assert.deepEqual(transitions, [220]);
      await page.waitForTimeout(400);
      assert.equal(await level(), '0', 'colour is fully through once the veil has opened');
      assert.deepEqual(problems, []);
      return { veilTransitionMs: transitions[0] };
    } finally { await context.close(); }
  });

  for (const [site, widthPx] of [['itsvari', 390], ['v4ri', 768]]) {
    await check(`${site}: the drawer is drawn down, traps focus and returns it`, async () => {
      const { context, page, problems } = await open({ widthPx, heightPx: 844 });
      try {
        await page.goto(`${sites[site]}/`, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        const opening = await page.evaluate(() => {
          document.querySelector('[data-drawer-trigger]').click();
          void document.documentElement.offsetWidth;
          return document.getAnimations().filter((animation) => animation.transitionProperty === 'clip-path').map((animation) => animation.effect.getComputedTiming().duration);
        });
        assert.deepEqual(opening, [320]);
        await page.waitForTimeout(450);
        const open = await page.evaluate(() => ({ open: document.querySelector('[data-navigation-dialog]').open, focusInside: document.querySelector('[data-navigation-dialog]').contains(document.activeElement), clip: getComputedStyle(document.querySelector('[data-navigation-dialog]')).clipPath }));
        assert.deepEqual(open, { open: true, focusInside: true, clip: 'inset(0px)' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        const closed = await page.evaluate(() => ({ open: document.querySelector('[data-navigation-dialog]').open, display: getComputedStyle(document.querySelector('[data-navigation-dialog]')).display, focusOnTrigger: document.activeElement === document.querySelector('[data-drawer-trigger]') }));
        assert.deepEqual(closed, { open: false, display: 'none', focusOnTrigger: true });
        assert.deepEqual(problems, []);
        return { openMs: opening[0] };
      } finally { await context.close(); }
    });
  }

  if (playwright.firefox) {
    await check('firefox: without cross-document transitions every page change is an ordinary navigation', async () => {
      let firefox;
      try { firefox = await playwright.firefox.launch({ headless: true }); }
      catch (error) { return { skipped: String(error).split('\n')[0] }; }
      try {
        const detail = {};
        for (const site of Object.keys(sites)) {
          const context = await firefox.newContext({ viewport: { width: 1280, height: 800 } });
          const page = await context.newPage();
          const problems = [];
          page.on('console', (message) => { if (message.type() === 'error') problems.push(message.text()); });
          page.on('pageerror', (error) => problems.push(error.message));
          await page.goto(`${sites[site]}/`, { waitUntil: 'load' });
          await page.locator(site === 'v4ri' ? '.hero-links a' : '.l-links a').first().hover();
          await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click(site === 'v4ri' ? '.v-nav a[href="/gigs"]' : '.i-nav a[href="/projects"]')]);
          const state = await page.evaluate(() => ({ path: location.pathname, overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
          assert.deepEqual(problems, []);
          assert.equal(state.overflowPx, 0);
          detail[site] = { version: firefox.version(), ...state };
          await context.close();
        }
        return detail;
      } finally { await firefox.close(); }
    });
  }
} finally {
  await browser.close();
  writeFileSync('/tmp/cloudark-motion-results.json', `${JSON.stringify(results, null, 2)}\n`);
  const failed = Object.entries(results).filter(([, result]) => result.status === 'failed');
  for (const [name, result] of failed) console.log(`\n${name}\n${result.error}`);
  console.log(`\n${Object.keys(results).length - failed.length} passed, ${failed.length} failed. Full results: /tmp/cloudark-motion-results.json`);
}
