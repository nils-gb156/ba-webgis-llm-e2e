// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isUvIndexLayerRequest = (url: string): boolean => {
    const candidates = [url];
    try {
      candidates.push(decodeURIComponent(url));
    } catch {
      // Ignore malformed URI sequences and keep the original URL.
    }

    return candidates.some((candidate) => {
      const normalized = candidate.toLowerCase();
      return (
        /uv[-_ ]?index/.test(normalized) ||
        /(?:layers?|layer)=.*uv[-_ ]?index/.test(normalized)
      );
    });
  };

  const readCanvasSnapshots = async (): Promise<string[]> => {
    const canvases = page.locator('canvas');
    const count = await canvases.count();
    const snapshots: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const canvas = canvases.nth(index);
      if (await canvas.isVisible()) {
        const box = await canvas.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          const screenshot = await canvas.screenshot();
          snapshots.push(screenshot.toString('base64'));
        }
      }
    }

    return snapshots;
  };

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const initialCanvasSnapshots = await readCanvasSnapshots();
  expect(initialCanvasSnapshots.length).toBeGreaterThan(0);

  const uvIndexLayerRequests: string[] = [];
  page.on('request', (request) => {
    if (isUvIndexLayerRequest(request.url())) {
      uvIndexLayerRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse((response) => {
    return isUvIndexLayerRequest(response.url()) && response.ok();
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();

  await expect.poll(() => uvIndexLayerRequests.length).toBeGreaterThan(0);

  await expect
    .poll(async () => JSON.stringify(await readCanvasSnapshots()))
    .not.toBe(JSON.stringify(initialCanvasSnapshots));
});
