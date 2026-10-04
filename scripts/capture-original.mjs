import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const root = 'https://nana-park.github.io/Portfolio/';
const width = Number(process.env.CAPTURE_WIDTH || 1440);
const height = width === 390 ? 844 : 900;
const pages = process.env.CAPTURE_PAGES?.split(',') || ['index', 'about', 'career', 'qualified', 'enjoy', 'projects', 'research', 'articles', 'lectures', 'awards', 'contact'];
const directory = `source-evidence/${width}`;
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390 });
for (const name of pages) {
  const page = await context.newPage();
  const errors = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push({ url: request.url(), reason: request.failure()?.errorText }));
  await page.goto(`${root}${name}.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts.ready; });
  const warning = page.locator('#mobile-warning-close');
  if (await warning.isVisible()) {
    await page.screenshot({ path: `${directory}/${name}-initial.png` });
    await warning.click();
    await page.locator('#mobile-warning-overlay').waitFor({ state: 'hidden' });
  }
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(total, 25000); y += height - 150) {
    await page.evaluate(value => window.scrollTo(0, value), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${directory}/${name}-full.png`, fullPage: true, animations: 'disabled' });
  await page.screenshot({ path: `${directory}/${name}-top.png`, animations: 'disabled' });
  const evidence = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(node => ({ tag: node.tagName, text: node.textContent.trim() })),
    images: Array.from(document.images).map(node => ({ src: node.currentSrc || node.src, alt: node.alt, loaded: node.complete && node.naturalWidth > 0 })),
    links: Array.from(document.querySelectorAll('a[href]')).map(node => ({ text: node.textContent.trim(), href: node.getAttribute('href') })),
    controls: Array.from(document.querySelectorAll('button,input,select')).map(node => ({ tag: node.tagName, id: node.id, label: node.getAttribute('aria-label') || node.textContent.trim(), type: node.getAttribute('type') })),
    typography: Array.from(document.querySelectorAll('h1,h2,nav,.logo,footer')).slice(0,30).map(node => {const style=getComputedStyle(node);const rect=node.getBoundingClientRect();return {tag:node.tagName,id:node.id,text:node.textContent.trim().slice(0,80),font:style.fontFamily,size:style.fontSize,weight:style.fontWeight,lineHeight:style.lineHeight,color:style.color,background:style.backgroundColor,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}}}),
    resourceUrls: performance.getEntriesByType('resource').map(entry => entry.name),
    html: document.documentElement.outerHTML,
  }));
  await fs.writeFile(`${directory}/${name}.json`, JSON.stringify({ ...evidence, errors, failures }, null, 2));
  if (name === 'index') {
    if (width === 390 && await page.locator('#mobileToggle').isVisible()) {
      await page.locator('#mobileToggle').click();
      await page.screenshot({ path: `${directory}/home-menu-open.png`, animations: 'disabled' });
      await page.locator('#mobileToggle').click();
    }
    if (width === 1440) {
      await page.locator('.has-dropdown').first().hover();
      await page.screenshot({ path: `${directory}/home-about-menu.png`, animations: 'disabled' });
      await page.mouse.move(100, 400);
    }
    if (await page.locator('#popupToggle').isVisible()) {
      await page.locator('#popupToggle').click();
      await page.screenshot({ path: `${directory}/home-materials-pending.png`, animations: 'disabled' });
      if (await page.locator('#popupMinimize').isVisible()) await page.locator('#popupMinimize').click();
    }
    if (await page.locator('#btn-career-next').count()) {
      await page.locator('#btn-career-next').click();
      await page.locator('#history').screenshot({ path: `${directory}/home-career-next.png`, animations: 'disabled' }).catch(() => {});
    }
  }
  console.log(`${name} ${width}px: ${evidence.images.filter(image=>image.loaded).length}/${evidence.images.length} images loaded; ${errors.length} source errors; ${failures.length} failed resources`);
  await page.close();
}
await browser.close();
