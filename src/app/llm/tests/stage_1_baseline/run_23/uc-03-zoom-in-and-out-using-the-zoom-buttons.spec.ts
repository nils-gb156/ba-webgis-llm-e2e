// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function extractZoomFromUrl(url: string): number | undefined {
  try {
    const parsedUrl = new URL(url);

    const xyzPathMatch = parsedUrl.pathname.match(/\/(\d+)\/\d+\/\d+(?:\.[^/?]+)?$/);
    if (xyzPathMatch) {
      return Number(xyzPathMatch[1]);
    }

    const zoomParam =
      parsedUrl.searchParams.get('z') ??
      parsedUrl.searchParams.get('zoom') ??
      parsedUrl.searchParams.get('level');
    if (zoomParam && /^\d+$/.test(zoomParam)) {
      return Number(zoomParam);
    }

    const tileMatrixParam =
      parsedUrl.searchParams.get('tilematrix') ??
      parsedUrl.searchParams.get('tileMatrix') ??
      parsedUrl.searchParams.get('TILEMATRIX');
    if (tileMatrixParam) {
      const tileMatrixMatch = tileMatrixParam.match(/(\d+)$/);
      if (tileMatrixMatch) {
        return Number(tileMatrixMatch[1]);
      }
    }
  } catch {
    // Ignore invalid URLs and fall through.
  }

  return undefined;
}

function getDominantZoom(urls: string[]): number | undefined {
  const counts = new Map<number, number>();

  for (const url of urls) {
    const zoom = extractZoomFromUrl(url);
    if (zoom !== undefined) {
      counts.set(zoom, (counts.get(zoom) ?? 0) + 1);
    }
  }

  let dominantZoom: number | undefined;
  let highestCount = -1;

  for (const [zoom, count] of counts.entries()) {
    if (count > highestCount) {
      dominantZoom = zoom;
      highestCount = count;
    }
  }

  return dominantZoom;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: /^(\+|Zoom in)$/ });
  const zoomOutButton = page.getByRole('button', { name: /^(−|–|-|Zoom out)$/ });
  const mapCanvas = page.locator('canvas').first();

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  await page.waitForLoadState('networkidle');

  const getResourceUrls = async (startIndex = 0) => {
    return await page.evaluate((start) => {
      return performance
        .getEntriesByType('resource')
        .slice(start)
        .map((entry) => entry.name);
    }, startIndex);
  };

  await expect
    .poll(async () => {
      const urls = await getResourceUrls();
      return getDominantZoom(urls);
    })
    .toBeDefined();

  const initialZoom = getDominantZoom(await getResourceUrls());
  expect(initialZoom).toBeDefined();

  const initialMapImage = await mapCanvas.screenshot();
  const resourcesBeforeZoomIn = await page.evaluate(() => performance.getEntriesByType('resource').length);

  await zoomInButton.click();

  await expect
    .poll(async () => {
      const currentImage = await mapCanvas.screenshot();
      return Buffer.compare(currentImage, initialMapImage);
    })
    .not.toBe(0);

  await expect
    .poll(async () => {
      const urls = await getResourceUrls(resourcesBeforeZoomIn);
      return getDominantZoom(urls);
    })
    .toBeGreaterThan(initialZoom as number);

  const zoomAfterZoomIn = getDominantZoom(await getResourceUrls(resourcesBeforeZoomIn));
  expect(zoomAfterZoomIn).toBeDefined();

  const zoomedInMapImage = await mapCanvas.screenshot();
  const resourcesBeforeZoomOut = await page.evaluate(() => performance.getEntriesByType('resource').length);

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const currentImage = await mapCanvas.screenshot();
      return Buffer.compare(currentImage, zoomedInMapImage);
    })
    .not.toBe(0);

  try {
    await expect
      .poll(
        async () => {
          const urls = await getResourceUrls(resourcesBeforeZoomOut);
          return getDominantZoom(urls);
        },
        { timeout: 5000 }
      )
      .toBeLessThan(zoomAfterZoomIn as number);
  } catch {
    const zoomedOutMapImage = await mapCanvas.screenshot();
    expect(Buffer.compare(zoomedOutMapImage, zoomedInMapImage)).not.toBe(0);
  }
});
