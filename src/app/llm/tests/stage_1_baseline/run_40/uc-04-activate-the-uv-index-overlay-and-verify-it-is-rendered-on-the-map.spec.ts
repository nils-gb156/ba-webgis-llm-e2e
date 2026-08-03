// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  let uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  if ((await uvIndexToggle.count()) === 0) {
    uvIndexToggle = page.getByRole('switch', { name: 'UV-Index', exact: true });
  }

  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const initialCanvasImage = await mapCanvas.screenshot();

  const requestedLayerTiles: string[] = [];
  let trackingRequests = false;

  page.on('request', request => {
    if (!trackingRequests) {
      return;
    }

    const url = request.url();
    const isLikelyMapTileRequest =
      request.resourceType() === 'image' ||
      /GetMap|GetTile|\/tile\/|\/tiles\/|format=image/i.test(url);

    if (isLikelyMapTileRequest) {
      requestedLayerTiles.push(url);
    }
  });

  const tileResponsePromise = page.waitForResponse(response => {
    if (!trackingRequests) {
      return false;
    }

    const request = response.request();
    const url = response.url();
    return (
      response.ok() &&
      (request.resourceType() === 'image' || /GetMap|GetTile|\/tile\/|\/tiles\/|format=image/i.test(url))
    );
  });

  trackingRequests = true;
  await uvIndexToggle.click({ force: true });
  await tileResponsePromise;

  await expect(uvIndexToggle).toBeChecked();
  await expect.poll(() => requestedLayerTiles.length).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const currentCanvasImage = await mapCanvas.screenshot();
      return currentCanvasImage.equals(initialCanvasImage);
    })
    .toBe(false);
});
