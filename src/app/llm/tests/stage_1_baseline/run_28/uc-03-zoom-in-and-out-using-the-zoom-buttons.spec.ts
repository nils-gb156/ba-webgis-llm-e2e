// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function extractZoomLevelFromUrl(url: string): number | undefined {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/(?:^|\/)(\d+)\/(\d+)\/(\d+)(?:\.[a-z0-9]+)?$/i);
    if (pathMatch) {
      return Number(pathMatch[1]);
    }

    const zoomParam = parsed.searchParams.get('z') ?? parsed.searchParams.get('zoom');
    if (zoomParam && /^\d+$/.test(zoomParam)) {
      return Number(zoomParam);
    }
  } catch {
    // Ignore malformed URLs.
  }

  return undefined;
}

function getMaxZoom(zooms: number[]): number {
  return zooms.length > 0 ? Math.max(...zooms) : -1;
}

async function captureStablePageScreenshot(page: any): Promise<string> {
  let previous = '';
  let stable = '';

  await expect.poll(async () => {
    await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      activeElement?.blur?.();
    });

    const current = (await page.screenshot({ animations: 'disabled' })).toString('base64');
    const isStable = current.length > 0 && current === previous;

    previous = current;
    stable = current;

    return isStable;
  }).toBe(true);

  return stable;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  const tileZoomRequests: number[] = [];

  page.on('request', request => {
    if (request.resourceType() !== 'image') {
      return;
    }

    const zoomLevel = extractZoomLevelFromUrl(request.url());
    if (zoomLevel !== undefined) {
      tileZoomRequests.push(zoomLevel);
    }
  });

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  await expect.poll(() => getMaxZoom(tileZoomRequests)).toBeGreaterThanOrEqual(0);
  const initialZoomLevel = getMaxZoom(tileZoomRequests);
  const initialScreenshot = await captureStablePageScreenshot(page);

  const zoomInRequestStart = tileZoomRequests.length;
  await zoomInButton.click();

  await expect.poll(() => getMaxZoom(tileZoomRequests.slice(zoomInRequestStart))).toBeGreaterThan(initialZoomLevel);
  const zoomedInScreenshot = await captureStablePageScreenshot(page);
  expect(zoomedInScreenshot).not.toBe(initialScreenshot);

  await zoomOutButton.click();

  const zoomedOutScreenshot = await captureStablePageScreenshot(page);
  expect(zoomedOutScreenshot).not.toBe(zoomedInScreenshot);
  expect(zoomedOutScreenshot).toBe(initialScreenshot);
});
