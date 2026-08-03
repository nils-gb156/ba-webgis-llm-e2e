// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  await page.waitForLoadState('networkidle');

  const beforeMapScreenshot = await mapContainer.screenshot();

  const normalizeUrl = (url: string) => {
    try {
      return decodeURIComponent(url).toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  };

  const isUvIndexTileUrl = (url: string) => {
    const normalizedUrl = normalizeUrl(url);
    const refersToUvIndexLayer =
      normalizedUrl.includes('uv-index') ||
      normalizedUrl.includes('uv_index') ||
      normalizedUrl.includes('uvindex') ||
      normalizedUrl.includes('uvi');
    const looksLikeMapTileOrWms =
      normalizedUrl.includes('getmap') ||
      normalizedUrl.includes('service=wms') ||
      normalizedUrl.includes('/tile') ||
      normalizedUrl.includes('/tiles');
    return refersToUvIndexLayer && looksLikeMapTileOrWms;
  };

  const uvIndexRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'image' && isUvIndexTileUrl(request.url())) {
      uvIndexRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse((response) => {
    return (
      response.ok() &&
      response.request().resourceType() === 'image' &&
      isUvIndexTileUrl(response.url())
    );
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();

  await expect.poll(() => uvIndexRequests.length > 0).toBe(true);

  await page.waitForLoadState('networkidle');

  await expect.poll(async () => {
    const afterMapScreenshot = await mapContainer.screenshot();
    return afterMapScreenshot.equals(beforeMapScreenshot);
  }).toBe(false);
});
