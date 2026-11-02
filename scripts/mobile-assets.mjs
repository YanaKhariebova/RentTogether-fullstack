// Deterministic exports from the existing photograph and SVG; no new artwork.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage();
  const photo = readFileSync('public/media/hero-brownstone.webp').toString('base64');
  const logo = readFileSync('src/shared/assets/renttogether-icon.svg').toString('base64');
  mkdirSync('public/icons', { recursive: true });
  for (const width of [640, 960]) {
    const data = await page.evaluate(
      async ({ photo, width }) => {
        const img = new Image();
        img.src = `data:image/webp;base64,${photo}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = Math.round(width / 1.58);
        // Keep both heads, handshake and box in a single photograph row.
        canvas
          .getContext('2d')
          .drawImage(img, 844, 0, 1210, 766, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/webp', 0.82).split(',')[1];
      },
      { photo, width },
    );
    writeFileSync(`public/media/hero-mobile-${width}.webp`, Buffer.from(data, 'base64'));
  }
  for (const [size, maskable, name] of [
    [192, false, 'icon-192'],
    [512, false, 'icon-512'],
    [512, true, 'maskable-512'],
    [180, false, 'apple-touch-icon'],
  ]) {
    const data = await page.evaluate(
      async ({ logo, size, maskable }) => {
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${logo}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.fillStyle = '#f5f8f4';
        context.fillRect(0, 0, size, size);
        const w = size * (maskable ? 0.6 : 0.82);
        const h = (w * img.naturalHeight) / img.naturalWidth;
        context.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { logo, size, maskable },
    );
    writeFileSync(`public/icons/${name}.png`, Buffer.from(data, 'base64'));
  }
} finally {
  await browser.close();
}
