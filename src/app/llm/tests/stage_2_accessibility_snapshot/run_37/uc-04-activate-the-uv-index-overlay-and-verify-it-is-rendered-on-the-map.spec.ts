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
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const uvIndexRequestMatcher = (url: string) => /(uv[-_]?index|uvi)/i.test(url);
  const uvIndexTileRequests: string[] = [];

  page.on('request', (request) => {
    if (uvIndexRequestMatcher(request.url())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse((response) => {
    return uvIndexRequestMatcher(response.url()) && response.ok();
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  await expect(uvIndexTileResponse.ok()).toBeTruthy();
  await expect(mapContainer).toBeVisible();
});
