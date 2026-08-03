// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
  const testStart = Date.now();
  const observedRequests: { url: string; time: number }[] = [];

  page.on('request', (request) => {
    if (['image', 'fetch', 'xhr'].includes(request.resourceType())) {
      observedRequests.push({ url: request.url(), time: Date.now() });
    }
  });

  const extractZoomCandidates = (url: string): number[] => {
    const candidates = new Set<number>();

    try {
      const parsedUrl = new URL(url);

      for (const parameterName of ['z', 'zoom', 'Z', 'ZOOM']) {
        const value = parsedUrl.searchParams.get(parameterName);
        if (value !== null) {
          const numericValue = Number(value);
          if (Number.isFinite(numericValue)) {
            candidates.add(numericValue);
          }
        }
      }

      for (const parameterName of ['tilematrix', 'TILEMATRIX', 'TileMatrix']) {
        const value = parsedUrl.searchParams.get(parameterName);
        if (value !== null) {
          const directNumericValue = Number(value);
          if (Number.isFinite(directNumericValue)) {
            candidates.add(directNumericValue);
          }

          const trailingDigitsMatch = value.match(/(\d+)$/);
          if (trailingDigitsMatch) {
            candidates.add(Number(trailingDigitsMatch[1]));
          }
        }
      }

      const xyzMatch = parsedUrl.pathname.match(/\/(\d+)\/\d+\/\d+(?:\.[A-Za-z0-9]+)?$/);
      if (xyzMatch) {
        candidates.add(Number(xyzMatch[1]));
      }

      const tileMatrixPathMatch = parsedUrl.pathname.match(/tilematrix[/:=_-]?(\d+)/i);
      if (tileMatrixPathMatch) {
        candidates.add(Number(tileMatrixPathMatch[1]));
      }
    } catch {
      return [];
    }

    return [...candidates].filter((value) => Number.isFinite(value));
  };

  const getRepresentativeZoom = (urls: string[]): number | undefined => {
    const counts = new Map<number, number>();

    for (const url of urls) {
      for (const candidate of extractZoomCandidates(url)) {
        counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
      }
    }

    if (counts.size === 0) {
      return undefined;
    }

    return [...counts.entries()].sort((a, b) => {
      const countDifference = b[1] - a[1];
      if (countDifference !== 0) {
        return countDifference;
      }
      return b[0] - a[0];
    })[0][0];
  };

  const getRequestUrlsInWindow = (start: number, end: number): string[] => {
    return observedRequests
      .filter((request) => request.time >= start && request.time <= end)
      .map((request) => request.url);
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {}

  let zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  if ((await zoomInButton.count()) === 0) {
    zoomInButton = page.getByTitle('Zoom in', { exact: true });
  }
  if ((await zoomInButton.count()) === 0) {
    zoomInButton = page.locator('.ol-zoom-in').first();
  }

  let zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });
  if ((await zoomOutButton.count()) === 0) {
    zoomOutButton = page.getByTitle('Zoom out', { exact: true });
  }
  if ((await zoomOutButton.count()) === 0) {
    zoomOutButton = page.locator('.ol-zoom-out').first();
  }

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const initialObservationEnd = Date.now();
  const initialZoomLevel = getRepresentativeZoom(getRequestUrlsInWindow(testStart, initialObservationEnd));
  const initialMapImage = await mapCanvas.screenshot();

  const zoomInStart = Date.now();
  await zoomInButton.click();

  await expect
    .poll(async () => {
      const currentMapImage = await mapCanvas.screenshot();
      return !currentMapImage.equals(initialMapImage);
    })
    .toBe(true);

  try {
    await page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch {}

  const zoomInEnd = Date.now();
  const zoomedInMapImage = await mapCanvas.screenshot();
  const zoomInLevel = getRepresentativeZoom(getRequestUrlsInWindow(zoomInStart, zoomInEnd));

  if (initialZoomLevel !== undefined && zoomInLevel !== undefined) {
    expect(zoomInLevel).toBeGreaterThan(initialZoomLevel);
  } else {
    expect(zoomedInMapImage.equals(initialMapImage)).toBe(false);
  }

  const zoomOutStart = Date.now();
  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const currentMapImage = await mapCanvas.screenshot();
      return !currentMapImage.equals(zoomedInMapImage);
    })
    .toBe(true);

  try {
    await page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch {}

  const zoomOutEnd = Date.now();
  const zoomedOutMapImage = await mapCanvas.screenshot();
  const zoomOutLevel = getRepresentativeZoom(getRequestUrlsInWindow(zoomOutStart, zoomOutEnd));

  if (zoomInLevel !== undefined && zoomOutLevel !== undefined) {
    expect(zoomOutLevel).toBeLessThan(zoomInLevel);
  } else {
    expect(zoomedOutMapImage.equals(zoomedInMapImage)).toBe(false);
  }
});
