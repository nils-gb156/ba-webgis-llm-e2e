// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  const getResourceEntries = async (): Promise<Array<{ name: string; initiatorType: string }>> => {
    return await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => {
        const resource = entry as PerformanceResourceTiming;
        return {
          name: resource.name,
          initiatorType: resource.initiatorType ?? ''
        };
      })
    );
  };

  const parseZoomFromUrl = (urlString: string): number | undefined => {
    try {
      const url = new URL(urlString);
      for (const key of ['z', 'zoom', 'level', 'lod', 'tilematrix', 'TileMatrix', 'tileMatrix']) {
        const value = url.searchParams.get(key);
        if (!value) {
          continue;
        }

        if (/^\d+$/.test(value)) {
          return Number(value);
        }

        const numericPart = value.match(/(\d+)/);
        if (numericPart) {
          return Number(numericPart[1]);
        }
      }
    } catch {
      // Ignore invalid URLs and fall back to regex-based parsing below.
    }

    for (const pattern of [
      /\/(\d+)\/\d+\/\d+(?:\.\w+)?(?:[?#]|$)/,
      /[?&](?:z|zoom|level|lod)=(\d+)(?:[&#]|$)/i,
      /[?&](?:tilematrix|TileMatrix)=(\d+)(?:[&#]|$)/i,
      /\/(?:tilematrix|TileMatrix)\/(\d+)(?:\/|[?#]|$)/i
    ]) {
      const match = urlString.match(pattern);
      if (match) {
        return Number(match[1]);
      }
    }

    return undefined;
  };

  const getDominantZoom = (entries: Array<{ name: string; initiatorType: string }>): number | undefined => {
    const counts = new Map<number, number>();

    for (const entry of entries) {
      if (!['image', 'fetch', 'xmlhttprequest'].includes(entry.initiatorType)) {
        continue;
      }

      const zoom = parseZoomFromUrl(entry.name);
      if (zoom === undefined) {
        continue;
      }

      counts.set(zoom, (counts.get(zoom) ?? 0) + 1);
    }

    if (counts.size === 0) {
      return undefined;
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  };

  const viewport = page.locator('.ol-viewport');

  const getViewportHash = async (): Promise<string> => {
    const image = await viewport.screenshot();
    return createHash('sha256').update(image).digest('hex');
  };

  const waitForStableViewportHash = async (): Promise<string> => {
    let previousHash: string | undefined;
    let stableHash: string | undefined;

    await expect
      .poll(
        async () => {
          const currentHash = await getViewportHash();
          stableHash = currentHash === previousHash ? currentHash : undefined;
          previousHash = currentHash;
          return stableHash;
        },
        { timeout: 15000 }
      )
      .toBeDefined();

    return stableHash!;
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  let zoomInButton = page.getByRole('button', { name: /zoom in/i });
  if ((await zoomInButton.count()) !== 1) {
    zoomInButton = page.getByRole('button', { name: /^\+$/ });
  }

  let zoomOutButton = page.getByRole('button', { name: /zoom out/i });
  if ((await zoomOutButton.count()) !== 1) {
    zoomOutButton = page.getByRole('button', { name: /^[−-]$/ });
  }

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(viewport).toBeVisible();

  let initialZoom: number | undefined;
  await expect
    .poll(
      async () => {
        initialZoom = getDominantZoom(await getResourceEntries());
        return initialZoom;
      },
      { timeout: 15000 }
    )
    .toBeDefined();

  const initialViewportHash = await waitForStableViewportHash();
  const baselineResourceCount = (await getResourceEntries()).length;

  await zoomInButton.click();

  let zoomedInZoom: number | undefined;
  await expect
    .poll(
      async () => {
        const newEntries = (await getResourceEntries()).slice(baselineResourceCount);
        zoomedInZoom = getDominantZoom(newEntries);
        return zoomedInZoom;
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(initialZoom!);

  await expect
    .poll(async () => await getViewportHash(), { timeout: 15000 })
    .not.toBe(initialViewportHash);

  const zoomedInViewportHash = await waitForStableViewportHash();

  await zoomOutButton.click();

  await expect
    .poll(async () => await getViewportHash(), { timeout: 15000 })
    .not.toBe(zoomedInViewportHash);

  await expect
    .poll(async () => await getViewportHash(), { timeout: 15000 })
    .toBe(initialViewportHash);
});
