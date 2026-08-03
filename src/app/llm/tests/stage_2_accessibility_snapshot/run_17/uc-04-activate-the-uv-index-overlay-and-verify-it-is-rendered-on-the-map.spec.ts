// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const uvIndexTileRequestUrls: string[] = [];
  const uvIndexRequestPattern =
    /(\/map\/uvi\/|[?&](?:layers?|layer)=.*(?:\buvi\b|uv(?:_|-)?index)|uv(?:_|-)?index)/i;
  const isUvIndexTileRequest = (url: string) =>
    uvIndexRequestPattern.test(url) &&
    !/legend/i.test(url) &&
    !/getlegendgraphic/i.test(url);

  page.on('request', (request) => {
    const url = request.url();
    if (request.resourceType() === 'image' && isUvIndexTileRequest(url)) {
      uvIndexTileRequestUrls.push(url);
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return response.request().resourceType() === 'image' && isUvIndexTileRequest(url) && response.ok();
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await expect.poll(() => uvIndexTileRequestUrls.length > 0).toBe(true);
  await expect.poll(() => uvIndexTileRequestUrls[0] ?? '').toMatch(uvIndexRequestPattern);

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();
});
