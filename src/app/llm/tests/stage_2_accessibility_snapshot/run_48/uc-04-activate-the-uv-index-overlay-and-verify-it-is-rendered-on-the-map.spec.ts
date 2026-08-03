// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isLikelyMapTileUrl = (url: string) =>
    /(service=wms|request=getmap|bbox=|tilematrix|\/tiles?\/|\/wmts\/|format=image|image%2F)/i.test(url);

  const layerSwitcher = page.getByTestId('layer-switcher');
  const mapContainer = page.getByTestId('map-container');
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await page.waitForLoadState('networkidle');
  await expect(layerSwitcher).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const initialMapScreenshot = (await mapContainer.screenshot()).toString('base64');

  const requestedTileUrls: string[] = [];
  const receivedTileUrls: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (isLikelyMapTileUrl(url)) {
      requestedTileUrls.push(url);
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    if (response.ok() && isLikelyMapTileUrl(url)) {
      receivedTileUrls.push(url);
    }
  });

  const initialRequestedCount = requestedTileUrls.length;
  const initialReceivedCount = receivedTileUrls.length;

  const tileResponsePromise = page.waitForResponse(
    (response) => response.ok() && isLikelyMapTileUrl(response.url())
  );

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await tileResponsePromise;
  await expect.poll(() => requestedTileUrls.length).toBeGreaterThan(initialRequestedCount);
  await expect.poll(() => receivedTileUrls.length).toBeGreaterThan(initialReceivedCount);
  await expect.poll(async () => (await mapContainer.screenshot()).toString('base64') === initialMapScreenshot).toBe(false);
});
