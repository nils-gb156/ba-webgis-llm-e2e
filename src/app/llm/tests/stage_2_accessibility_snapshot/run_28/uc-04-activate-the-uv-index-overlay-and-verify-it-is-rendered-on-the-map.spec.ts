// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const isUvIndexTileRequest = (url: string) => {
    const normalizedUrl = url.toLowerCase();
    const refersToUvIndex =
      normalizedUrl.includes('uv-index') ||
      normalizedUrl.includes('uv_index') ||
      normalizedUrl.includes('uvindex') ||
      normalizedUrl.includes('uvi');
    const looksLikeTileOrMapImage =
      normalizedUrl.includes('getmap') ||
      normalizedUrl.includes('/tile') ||
      normalizedUrl.includes('/wmts') ||
      normalizedUrl.includes('/wms') ||
      /\.(png|jpg|jpeg|webp)(\?|$)/i.test(url);
    const isNotLegendRequest = !normalizedUrl.includes('legend');

    return refersToUvIndex && looksLikeTileOrMapImage && isNotLegendRequest;
  };

  const uvIndexTileRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (isUvIndexTileRequest(url)) {
      uvIndexTileRequests.push(url);
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    return response.ok() && isUvIndexTileRequest(response.url());
  });

  await uvIndexCheckbox.click({ force: true });
  await expect(uvIndexCheckbox).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;

  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
  expect(uvIndexTileResponse.ok()).toBeTruthy();
  expect((await uvIndexTileResponse.headerValue('content-type')) ?? '').toMatch(/^image\//);

  const mapCanvas = mapContainer.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();
});
