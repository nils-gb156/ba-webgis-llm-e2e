// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: /^(Zoom in|\+)$/i });
  const zoomOutButton = page.getByRole('button', { name: /^(Zoom out|−|-)$/i });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  type TileEntry = { url: string; zoom: number };

  const extractTileZoom = (url: string): number | undefined => {
    const match = url.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.(?:png|jpg|jpeg|webp|gif|pbf))?(?:[?#].*)?$/i);
    if (!match) {
      return undefined;
    }

    return Number(match[1]);
  };

  const getTileEntries = async (): Promise<TileEntry[]> => {
    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry: any) => ({
        name: entry.name,
        initiatorType: entry.initiatorType
      }))
    );

    return resources
      .filter(
        ({ name, initiatorType }: { name: string; initiatorType: string }) =>
          initiatorType === 'img' ||
          initiatorType === 'image' ||
          /\.(png|jpg|jpeg|webp|gif|pbf)(?:[?#].*)?$/i.test(name)
      )
      .map(({ name }: { name: string }) => {
        const zoom = extractTileZoom(name);
        return zoom === undefined ? undefined : { url: name, zoom };
      })
      .filter((entry: TileEntry | undefined): entry is TileEntry => entry !== undefined);
  };

  const getDominantZoom = (entries: TileEntry[]): number | undefined => {
    const counts = new Map<number, number>();

    for (const entry of entries) {
      counts.set(entry.zoom, (counts.get(entry.zoom) ?? 0) + 1);
    }

    const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return dominant?.[0];
  };

  await expect.poll(async () => (await getTileEntries()).length).toBeGreaterThan(0);

  const initialEntries = await getTileEntries();
  const initialZoom = getDominantZoom(initialEntries);

  expect(initialZoom).toBeDefined();
  if (initialZoom === undefined) {
    throw new Error('Could not determine the initial map zoom level from loaded tile resources.');
  }

  const initialUrls = new Set(initialEntries.map((entry) => entry.url));

  let zoomAfterZoomIn: number | undefined;
  await zoomInButton.click();

  await expect.poll(async () => {
    const newEntries = (await getTileEntries()).filter((entry) => !initialUrls.has(entry.url));
    zoomAfterZoomIn = getDominantZoom(newEntries);
    return zoomAfterZoomIn;
  }).toBeGreaterThan(initialZoom);

  expect(zoomAfterZoomIn).toBeDefined();
  if (zoomAfterZoomIn === undefined) {
    throw new Error('Could not determine the zoom level after clicking the zoom in button.');
  }

  const entriesAfterZoomIn = await getTileEntries();
  const urlsAfterZoomIn = new Set(entriesAfterZoomIn.map((entry) => entry.url));

  let zoomAfterZoomOut: number | undefined;
  await zoomOutButton.click();

  await expect.poll(async () => {
    const newEntries = (await getTileEntries()).filter((entry) => !urlsAfterZoomIn.has(entry.url));
    zoomAfterZoomOut = getDominantZoom(newEntries);
    return zoomAfterZoomOut;
  }).toBeLessThan(zoomAfterZoomIn);

  expect(zoomAfterZoomOut).toBeDefined();
  if (zoomAfterZoomOut === undefined) {
    throw new Error('Could not determine the zoom level after clicking the zoom out button.');
  }

  expect(zoomAfterZoomIn).toBeGreaterThan(initialZoom);
  expect(zoomAfterZoomOut).toBeLessThan(zoomAfterZoomIn);
});
