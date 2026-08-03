// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();

  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const uvIndexTileRequestUrls: string[] = [];

  page.on('request', request => {
    const url = request.url();
    const urlLower = url.toLowerCase();

    const isTileLikeRequest =
      request.resourceType() === 'image' ||
      urlLower.includes('service=wms') ||
      urlLower.includes('request=getmap') ||
      urlLower.includes('wmts') ||
      urlLower.includes('/tile') ||
      urlLower.includes('/tiles/');

    const isUvIndexLayerRequest =
      (urlLower.includes('uv-index') || urlLower.includes('uvi')) &&
      !urlLower.includes('station');

    if (isTileLikeRequest && isUvIndexLayerRequest) {
      uvIndexTileRequestUrls.push(url);
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    const urlLower = response.url().toLowerCase();

    const isTileLikeResponse =
      response.ok() &&
      (response.request().resourceType() === 'image' ||
        urlLower.includes('service=wms') ||
        urlLower.includes('request=getmap') ||
        urlLower.includes('wmts') ||
        urlLower.includes('/tile') ||
        urlLower.includes('/tiles/'));

    const isUvIndexLayerResponse =
      (urlLower.includes('uv-index') || urlLower.includes('uvi')) &&
      !urlLower.includes('station');

    return isTileLikeResponse && isUvIndexLayerResponse;
  });

  await uvIndexCheckbox.click({ force: true });
  await expect(uvIndexCheckbox).toBeChecked();

  await expect.poll(() => uvIndexTileRequestUrls.length).toBeGreaterThan(0);

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();
  expect((await uvIndexTileResponse.headerValue('content-type')) ?? '').toMatch(/image\//i);
});
