const crypto = require('crypto');
const fs = require('fs');
const { chromium } = require('playwright');

const BASE_URL = (process.env.MEW_TEST_BASE_URL || 'http://localhost:49765').replace(/\/$/, '');
const HOME_URL = `${BASE_URL}/`;
const AWAY_URL = `${BASE_URL}/mystery/`;
const MAX_SCREENSHOT_DIFF_RATIO = 0.05;

function hash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function capture(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  }));

  const screenshot = await page.screenshot({ animations: 'disabled' });
  const state = await page.evaluate(() => {
    const checked = [...document.querySelectorAll('#filters-options input[type="checkbox"]')]
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    const firstProducts = [...document.querySelectorAll('.product-card__name')]
      .slice(0, 12)
      .map((el) => el.textContent.trim());
    const firstImages = [...document.querySelectorAll('.product-card[data-product-id] img')]
      .slice(0, 12)
      .map((img) => ({
        src: img.getAttribute('src'),
        dataSrc: img.getAttribute('data-src'),
      }));

    return {
      scrollY: Math.round(window.scrollY),
      filtersHidden: document.getElementById('filters-modal')?.hidden,
      filtersExpanded: document.getElementById('filters-open-btn')?.getAttribute('aria-expanded'),
      checked,
      searchValue: document.getElementById('home-search-input')?.value,
      clearSearchHidden: document.getElementById('home-search-clear-btn')?.hidden,
      hpText: document.getElementById('filters-hp-count')?.textContent,
      usedText: document.getElementById('filters-used-tags')?.innerText,
      itemCount: document.getElementById('item-count')?.textContent,
      modalScrollTop: document.querySelector('.filters-modal-body')?.scrollTop,
      focusVisibleId: document.activeElement?.matches(':focus-visible')
        ? document.activeElement.id || ''
        : '',
      firstProducts,
      firstImages,
      scrollButtonHidden: document.getElementById('scroll-to-catalog-btn')?.hidden,
    };
  });

  return { state, screenshot, screenshotHash: hash(screenshot) };
}

function assertEqual(label, actual, expected) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${label} mismatch\nactual:   ${actualJson}\nexpected: ${expectedJson}`);
  }
}

async function compareScreenshots(page, before, after) {
  return page.evaluate(
    async ({ beforeBase64, afterBase64 }) => {
      const loadImage = (src) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

      const [beforeImage, afterImage] = await Promise.all([
        loadImage(`data:image/png;base64,${beforeBase64}`),
        loadImage(`data:image/png;base64,${afterBase64}`),
      ]);

      if (beforeImage.width !== afterImage.width || beforeImage.height !== afterImage.height) {
        return {
          widthMismatch: true,
          diffPixels: Infinity,
          totalPixels: 0,
          ratio: Infinity,
        };
      }

      const canvas = document.createElement('canvas');
      canvas.width = beforeImage.width;
      canvas.height = beforeImage.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      context.drawImage(beforeImage, 0, 0);
      const beforeData = context.getImageData(0, 0, canvas.width, canvas.height).data;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(afterImage, 0, 0);
      const afterData = context.getImageData(0, 0, canvas.width, canvas.height).data;

      let diffPixels = 0;
      for (let index = 0; index < beforeData.length; index += 4) {
        const delta =
          Math.abs(beforeData[index] - afterData[index]) +
          Math.abs(beforeData[index + 1] - afterData[index + 1]) +
          Math.abs(beforeData[index + 2] - afterData[index + 2]) +
          Math.abs(beforeData[index + 3] - afterData[index + 3]);
        if (delta > 8) {
          diffPixels += 1;
        }
      }

      const totalPixels = canvas.width * canvas.height;
      return {
        widthMismatch: false,
        diffPixels,
        totalPixels,
        ratio: diffPixels / totalPixels,
      };
    },
    {
      beforeBase64: before.toString('base64'),
      afterBase64: after.toString('base64'),
    }
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(AWAY_URL, { waitUntil: 'domcontentloaded' });
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.product-card', { timeout: 20000 });
  await page.locator('#filters-open-btn').click();
  await page.locator('#in-stock').check();
  await page.locator('#filters-show-results').click();
  await page.waitForFunction(() => document.getElementById('filters-modal')?.hidden === true);
  await page.locator('#home-search-input').fill('e');
  await page.locator('#home-search-form').evaluate((form) => {
    form.requestSubmit();
  });
  await page.waitForFunction(() => document.getElementById('home-search-clear-btn')?.hidden === false);
  await page.evaluate(() => {
    const target = document.querySelector('.product-card:nth-of-type(18)');
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });

  await page.locator('#filters-open-btn').click();
  await page.locator('#price-low').check();
  await page.evaluate(() => {
    if (
      document.activeElement instanceof HTMLElement &&
      !document.activeElement.matches(':focus-visible')
    ) {
      document.activeElement.blur();
    }

    const body = document.querySelector('.filters-modal-body');
    if (body) {
      const maxScrollTop = Math.max(0, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.min(64, maxScrollTop);
    }
  });

  const before = await capture(page);
  await page.goto(AWAY_URL, { waitUntil: 'domcontentloaded' });
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('filters-modal')?.hidden === false);
  await page.waitForTimeout(250);
  const afterBack = await capture(page);

  assertEqual('visible state after Back', afterBack.state, before.state);
  if (afterBack.screenshotHash !== before.screenshotHash) {
    fs.writeFileSync('/private/tmp/home-before.png', before.screenshot);
    fs.writeFileSync('/private/tmp/home-after-back.png', afterBack.screenshot);
  }
  const backScreenshotDiff = await compareScreenshots(page, before.screenshot, afterBack.screenshot);
  if (backScreenshotDiff.ratio > MAX_SCREENSHOT_DIFF_RATIO) {
    throw new Error(`Back viewport screenshot mismatch: ${JSON.stringify(backScreenshotDiff)}`);
  }

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('filters-modal')?.hidden === false);
  await page.waitForTimeout(250);
  const afterForward = await capture(page);

  assertEqual('visible state after Forward', afterForward.state, before.state);
  if (afterForward.screenshotHash !== before.screenshotHash) {
    fs.writeFileSync('/private/tmp/home-after-forward.png', afterForward.screenshot);
  }
  const forwardScreenshotDiff = await compareScreenshots(
    page,
    before.screenshot,
    afterForward.screenshot
  );
  if (forwardScreenshotDiff.ratio > MAX_SCREENSHOT_DIFF_RATIO) {
    throw new Error(`Forward viewport screenshot mismatch: ${JSON.stringify(forwardScreenshotDiff)}`);
  }

  await page.locator('.filter-tag--clear').click();
  const clearedDraftFilters = await page.evaluate(() => (
    [...document.querySelectorAll('#filters-options input[type="checkbox"]')]
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value)
  ));
  assertEqual('restored filter tag handlers', clearedDraftFilters, []);

  await page.locator('#filters-modal-close').click();
  await page.waitForFunction(() => document.getElementById('filters-modal')?.hidden === true);
  await page.locator('.product-card__media-btn').first().click();
  await page.waitForFunction(() => document.getElementById('product-preview-modal')?.hidden === false);
  await page.locator('#product-preview-close').click();
  await page.waitForFunction(() => document.getElementById('product-preview-modal')?.hidden === true);

  console.log(JSON.stringify({
    ok: true,
    checked: afterBack.state.checked,
    hpText: afterBack.state.hpText,
    itemCount: afterBack.state.itemCount,
    backScreenshotDiff,
    forwardScreenshotDiff,
    screenshotHash: afterBack.screenshotHash,
  }, null, 2));

  await browser.close();
})().catch(async (error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
