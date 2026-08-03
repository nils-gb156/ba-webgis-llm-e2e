// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function isUvIndexTileUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  const hasMapLayerHint =
    lowerUrl.includes('getmap') ||
    lowerUrl.includes('wms') ||
    lowerUrl.includes('wmts') ||
    lowerUrl.includes('/tile');
  const hasUvIndexHint =
    lowerUrl.includes('uv-index') ||
    lowerUrl.includes('uv_index') ||
    lowerUrl.includes('uvindex') ||
    lowerUrl.includes('uvi') ||
    lowerUrl.includes('ultraviolet');
  const isStationLayerRequest = lowerUrl.includes('station');

  return hasMapLayerHint && hasUvIndexHint && !isStationLayerRequest;
}

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const uvIndexTileRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (isUvIndexTileUrl(url)) {
      uvIndexTileRequests.push(url);
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(
    response => isUvIndexTileUrl(response.url()) && response.ok(),
    { timeout: 20000 }
  );

  await uvIndexCheckbox.click({ force: true });
  await expect(uvIndexCheckbox).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();

  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
});
