// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function extractZoomFromUrl(rawUrl: string): number | undefined {
  try {
    const url = new URL(rawUrl);

    for (const [key, value] of url.searchParams.entries()) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === 'z' || normalizedKey === 'zoom' || normalizedKey === 'level' || normalizedKey === 'tilematrix') {
        const match = value.match(/-?\d+/);
        if (match) {
          return Number(match[0]);
        }
      }
    }

    const segments = url.pathname.split('/').filter(Boolean);
    for (let i = 0; i <= segments.length - 3; i++) {
      const z = segments[i].match(/^\d+$/);
      const x = segments[i + 1].match(/^\d+$/);
      const y = segments[i + 2].match(/^\d+(?:\.[a-z0-9]+)?$/i);

      if (z && x && y) {
        return Number(z[0]);
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function getMostFrequentZoom(levels: number[]): number | undefined {
  if (levels.length === 0) {
    return undefined;
  }

  const counts = new Map<number, number>();
  for (const level of levels) {
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  let bestLevel: number | undefined;
  let bestCount = -1;

  for (const [level, count] of counts.entries()) {
    if (count > bestCount) {
      bestLevel = level;
      bestCount = count;
    }
  }

  return bestLevel;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const observedZoomLevels: number[] = [];
  page.on('request', (request) => {
    if (request.resourceType() !== 'image') {
      return;
    }

    const zoom = extractZoomFromUrl(request.url());
    if (zoom !== undefined) {
      observedZoomLevels.push(zoom);
    }
  });

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  await expect.poll(() => {
    const zoom = getMostFrequentZoom(observedZoomLevels);
    return zoom ?? -1;
  }).toBeGreaterThanOrEqual(0);

  const initialZoom = getMostFrequentZoom(observedZoomLevels);
  if (initialZoom === undefined) {
    throw new Error('Could not determine the initial zoom level from map tile requests.');
  }

  const requestCountBeforeZoomIn = observedZoomLevels.length;
  await zoomInButton.click();

  await expect.poll(() => {
    const zoomsAfterZoomIn = observedZoomLevels
      .slice(requestCountBeforeZoomIn)
      .filter((zoom) => zoom > initialZoom);

    return zoomsAfterZoomIn.length > 0 ? Math.max(...zoomsAfterZoomIn) : -1;
  }).toBeGreaterThan(initialZoom);

  const zoomAfterZoomIn = Math.max(
    ...observedZoomLevels.slice(requestCountBeforeZoomIn).filter((zoom) => zoom > initialZoom)
  );

  const requestCountBeforeZoomOut = observedZoomLevels.length;
  await zoomOutButton.click();

  await expect.poll(() => {
    const zoomsAfterZoomOut = observedZoomLevels
      .slice(requestCountBeforeZoomOut)
      .filter((zoom) => zoom < zoomAfterZoomIn);

    return zoomsAfterZoomOut.length > 0 ? Math.min(...zoomsAfterZoomOut) : Number.POSITIVE_INFINITY;
  }).toBeLessThan(zoomAfterZoomIn);
});
