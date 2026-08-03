// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function extractZoomFromUrl(url: string): number | undefined {
  try {
    const parsed = new URL(url);
    const hasTileCoordinatesInQuery =
      (parsed.searchParams.has('x') && parsed.searchParams.has('y')) ||
      (parsed.searchParams.has('tilecol') && parsed.searchParams.has('tilerow')) ||
      (parsed.searchParams.has('tilematrix') &&
        (parsed.searchParams.has('tilecol') || parsed.searchParams.has('tilerow')));

    for (const key of ['z', 'zoom', 'tilematrix']) {
      const value = parsed.searchParams.get(key);
      if (value && /^-?\d+$/.test(value) && hasTileCoordinatesInQuery) {
        return Number(value);
      }
    }
  } catch {
    // Ignore URL parsing errors and continue with regex-based extraction.
  }

  const tileMatrixMatch = url.match(/[?&]TileMatrix=(\d+)/i);
  if (tileMatrixMatch) {
    return Number(tileMatrixMatch[1]);
  }

  const xyzMatch = url.match(/\/(\d+)\/-?\d+\/-?\d+(?:\.\w+)?(?:$|[?#])/);
  if (xyzMatch) {
    return Number(xyzMatch[1]);
  }

  return undefined;
}

function mostFrequentZoom(urls: string[]): number | null {
  const zooms = urls
    .map((url) => extractZoomFromUrl(url))
    .filter((zoom): zoom is number => zoom !== undefined);

  if (zooms.length === 0) {
    return null;
  }

  const counts = new Map<number, number>();
  for (const zoom of zooms) {
    counts.set(zoom, (counts.get(zoom) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await page.waitForLoadState('load');

  const mapViewport = page.locator('.ol-viewport');
  await expect(mapViewport).toBeVisible();

  const zoomInButton = mapViewport.getByRole('button', { name: /^(Zoom in|\+)$/ });
  const zoomOutButton = mapViewport.getByRole('button', { name: /^(Zoom out|−|–|-)$/ });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const getResourceUrls = async (): Promise<string[]> => {
    return await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name)
    );
  };

  const readInitialZoom = async (): Promise<number | null> => {
    const resourceUrls = await getResourceUrls();
    return mostFrequentZoom(resourceUrls);
  };

  await expect.poll(readInitialZoom).not.toBeNull();

  const initialZoom = await readInitialZoom();
  if (initialZoom === null) {
    throw new Error('Could not determine the initial map zoom level from loaded tile resources.');
  }

  const initialMapImage = await mapViewport.screenshot();

  const zoomInRequestUrls: string[] = [];
  const zoomOutRequestUrls: string[] = [];
  let capturePhase: 'idle' | 'zoomIn' | 'zoomOut' = 'idle';

  page.on('request', (request) => {
    if (capturePhase === 'zoomIn') {
      zoomInRequestUrls.push(request.url());
    } else if (capturePhase === 'zoomOut') {
      zoomOutRequestUrls.push(request.url());
    }
  });

  const resourceUrlsBeforeZoomIn = new Set(await getResourceUrls());
  capturePhase = 'zoomIn';
  await zoomInButton.click();

  const readZoomAfterZoomIn = async (): Promise<number | null> => {
    const resourceUrls = await getResourceUrls();
    const newResourceUrls = resourceUrls.filter((url) => !resourceUrlsBeforeZoomIn.has(url));
    const observedZooms = [...newResourceUrls, ...zoomInRequestUrls]
      .map((url) => extractZoomFromUrl(url))
      .filter((zoom): zoom is number => zoom !== undefined)
      .filter((zoom) => zoom > initialZoom);

    if (observedZooms.length === 0) {
      return null;
    }

    return Math.max(...observedZooms);
  };

  await expect.poll(readZoomAfterZoomIn).not.toBeNull();

  const zoomedInZoom = await readZoomAfterZoomIn();
  if (zoomedInZoom === null) {
    throw new Error('Could not determine a higher zoom level after clicking the zoom in button.');
  }

  expect(zoomedInZoom).toBeGreaterThan(initialZoom);

  await expect
    .poll(async () => {
      const currentMapImage = await mapViewport.screenshot();
      return currentMapImage.equals(initialMapImage);
    })
    .toBe(false);

  const zoomedInMapImage = await mapViewport.screenshot();

  const resourceUrlsBeforeZoomOut = new Set(await getResourceUrls());
  capturePhase = 'zoomOut';
  await zoomOutButton.click();

  let observedZoomedOutZoom: number | null = null;

  await expect
    .poll(async () => {
      const resourceUrls = await getResourceUrls();
      const newResourceUrls = resourceUrls.filter((url) => !resourceUrlsBeforeZoomOut.has(url));
      const lowerZooms = [...newResourceUrls, ...zoomOutRequestUrls]
        .map((url) => extractZoomFromUrl(url))
        .filter((zoom): zoom is number => zoom !== undefined)
        .filter((zoom) => zoom < zoomedInZoom);

      if (lowerZooms.length > 0) {
        observedZoomedOutZoom = Math.min(...lowerZooms);
        return true;
      }

      const currentMapImage = await mapViewport.screenshot();
      return currentMapImage.equals(initialMapImage) && !currentMapImage.equals(zoomedInMapImage);
    })
    .toBe(true);

  capturePhase = 'idle';

  if (observedZoomedOutZoom !== null) {
    expect(observedZoomedOutZoom).toBeLessThan(zoomedInZoom);
  } else {
    const finalMapImage = await mapViewport.screenshot();
    expect(finalMapImage.equals(initialMapImage)).toBe(true);
    expect(finalMapImage.equals(zoomedInMapImage)).toBe(false);
  }
});
