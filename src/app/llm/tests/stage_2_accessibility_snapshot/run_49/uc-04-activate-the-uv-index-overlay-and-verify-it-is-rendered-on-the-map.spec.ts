// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const mapContainer = page.getByTestId('map-container');
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const uvIndexTileRequests: string[] = [];
  const isUvIndexTileRequest = (url: string, resourceType?: string) => {
    const isImageRequest = resourceType === undefined || resourceType === 'image';
    return isImageRequest && /(?:uv[-_ ]?index|uvi)/i.test(url) && !/legend/i.test(url);
  };

  page.on('request', (request) => {
    if (isUvIndexTileRequest(request.url(), request.resourceType())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse((response) => {
    return (
      isUvIndexTileRequest(response.url(), response.request().resourceType()) &&
      response.ok()
    );
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();

  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
  await expect(mapContainer).toBeVisible();
});
