/* global process, console, document, window, innerHeight, requestAnimationFrame, getComputedStyle */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const playwrightDirectory = process.argv[2];
if (!playwrightDirectory) throw new Error('Pass the directory of an installed Playwright package.');
const { chromium } = await import(pathToFileURL(resolve(playwrightDirectory, 'index.mjs')).href);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const results = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    async function open(url) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
    }
    async function jump(slug) {
      return page.evaluate(async (slug) => {
        const heading = slug && document.getElementById(slug);
        const requestedScrollTop = slug === 'bottom' ? document.documentElement.scrollHeight : heading ? window.scrollY + heading.getBoundingClientRect().top - (parseFloat(getComputedStyle(heading).scrollMarginTop) || 24) : 0;
        window.scrollTo({ top: requestedScrollTop, behavior: 'instant' });
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const links = [...document.querySelectorAll('[data-article-contents] a[data-contents-slug]')];
        const active = links.filter(link => link.getAttribute('aria-current') === 'location');
        const headings = links.map(link => { const element = document.getElementById(link.dataset.contentsSlug); return { id: element.id, top: element.getBoundingClientRect().top }; });
        const activeHeading = active[0] && document.getElementById(active[0].dataset.contentsSlug);
        const nextHeading = activeHeading && headings[headings.findIndex(entry => entry.id === activeHeading.id) + 1];
        const sectionIntersectsViewport = !!activeHeading && activeHeading.getBoundingClientRect().top < innerHeight && (!nextHeading || nextHeading.top > 0);
        const header = document.querySelector('header');
        return { requestedScrollTop, achievedScrollY: window.scrollY, maxScrollTop: document.documentElement.scrollHeight - innerHeight, headings, activeIds: active.map(link => link.dataset.contentsSlug), sectionIntersectsViewport, labelColour: active[0] && getComputedStyle(active[0].querySelector('.contents-label')).color, numberColour: active[0] && getComputedStyle(active[0].querySelector('.contents-number')).color, headerBottom: header && header.getBoundingClientRect().bottom };
      }, slug);
    }
    function check(result, id) { assert.deepEqual(result.activeIds, [id]); }
    function red(result) { assert.equal(result.activeIds.length, 1); assert.equal(result.labelColour, 'rgb(220, 38, 38)'); assert.equal(result.numberColour, 'rgb(220, 38, 38)'); }
    await open('http://127.0.0.1:4321/projects/cloudark');
    const project = await jump('content-with-a-shape');
    results.project = { target: project, top: await jump(null) };
    if (project.requestedScrollTop > project.maxScrollTop) { check(project, project.headings.at(-1).id); assert.ok(project.sectionIntersectsViewport); } else check(project, 'content-with-a-shape');
    check(results.project.top, project.headings[0].id);
    await open('http://127.0.0.1:4321/cv');
    results.cv = { bottom: await jump('bottom'), work: await jump('work-experience'), skills: await jump('skills'), workReverse: await jump('work-experience'), skillsForward: await jump('skills') };
    check(results.cv.bottom, 'skills');
    for (const [name, result] of Object.entries(results.cv)) { check(result, name.startsWith('work') ? 'work-experience' : 'skills'); red(result); }
    await open('http://127.0.0.1:4322/gigs/blacklight-rave-xvi-nosferavetu');
    results.dj = await jump('event-description');
    check(results.dj, 'event-description'); red(results.dj);
    assert.ok(results.dj.headings.find(heading => heading.id === 'event-description').top >= results.dj.headerBottom);
    results.status = 'passed';
  } catch (error) { results.status = 'failed'; results.error = error.stack; process.exitCode = 1; }
  finally { await browser.close(); writeFileSync('docs/design/qa/cv-scrollspy-results.json', JSON.stringify(results, null, 2) + '\n'); }
})().catch(error => { console.error(error); process.exitCode = 1; });
