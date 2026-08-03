// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  const requestedTileZooms: number[] = [];

  const parseZoomFromUrl = (url: string): number | undefined => {
    try {
      const parsedUrl = new URL(url);

      const zoomParam =
        parsedUrl.searchParams.get('z') ??
        parsedUrl.searchParams.get('zoom') ??
        parsedUrl.searchParams.get('tilematrix') ??
        parsedUrl.searchParams.get('TileMatrix');

      if (zoomParam) {
        const zoomMatch = zoomParam.match(/(\d+)$/);
        if (zoomMatch) {
          return Number(zoomMatch[1]);
        }
      }

      const pathMatch = parsedUrl.pathname.match(/\/(\d+)\/\d+\/\d+(?:[.@][^/]+)?$/);
      if (pathMatch) {
        return Number(pathMatch[1]);
      }
    } catch {
      // Ignore malformed URLs.
    }

    return undefined;
  };

  const getDominantZoomSince = (startIndex: number): number | undefined => {
    const counts = new Map<number, number>();

    for (const zoom of requestedTileZooms.slice(startIndex)) {
      counts.set(zoom, (counts.get(zoom) ?? 0) + 1);
    }

    let dominantZoom: number | undefined;
    let maxCount = -1;

    for (const [zoom, count] of counts.entries()) {
      if (count > maxCount) {
        dominantZoom = zoom;
        maxCount = count;
      }
    }

    return dominantZoom;
  };

  page.on('request', request => {
    if (request.resourceType() !== 'image') {
      return;
    }

    const zoom = parseZoomFromUrl(request.url());
    if (zoom !== undefined) {
      requestedTileZooms.push(zoom);
    }
  });

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.route('**/*', async route => {
    await route.continue();
  });
  await page.waitForLoadState('networkidle');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  await expect.poll(() => requestedTileZooms.length).toBeGreaterThan(0);

  const initialZoom = getDominantZoomSince(0);
  expect(initialZoom).toBeDefined();

  const zoomInStartIndex = requestedTileZooms.length;
  await zoomInButton.click();

  await expect.poll(() => requestedTileZooms.length).toBeGreaterThan(zoomInStartIndex);
  await expect.poll(() => getDominantZoomSince(zoomInStartIndex)).toBeGreaterThan(initialZoom!);

  const zoomedInZoom = getDominantZoomSince(zoomInStartIndex);
  expect(zoomedInZoom).toBeDefined();
  expect(zoomedInZoom!).toBeGreaterThan(initialZoom!);

  const zoomOutStartIndex = requestedTileZooms.length;
  await zoomOutButton.click();

  await expect.poll(() => requestedTileZooms.length).toBeGreaterThan(zoomOutStartIndex);
  await expect.poll(() => getDominantZoomSince(zoomOutStartIndex)).toBeLessThan(zoomedInZoom!);
});
