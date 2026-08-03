// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC4 Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isUvIndexOverlayTileUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();
    const mentionsUvIndex = ['uv-index', 'uv_index', 'uvindex', 'uvi'].some((token) =>
      lowerUrl.includes(token)
    );
    const looksLikeMapLayerRequest = [
      'service=wms',
      'request=getmap',
      '/wms',
      '/tile',
      '/tiles/',
      'bbox='
    ].some((token) => lowerUrl.includes(token));
    const isLegendOrStationAsset = ['legend', 'station', 'stations'].some((token) =>
      lowerUrl.includes(token)
    );

    return mentionsUvIndex && looksLikeMapLayerRequest && !isLegendOrStationAsset;
  };

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('layer-switcher-toggle')).toHaveAttribute('aria-pressed', 'true');

  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const uvIndexTileRequests: string[] = [];
  let trackingEnabled = false;

  page.on('request', (request) => {
    if (trackingEnabled && isUvIndexOverlayTileUrl(request.url())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(
    (response) => trackingEnabled && isUvIndexOverlayTileUrl(response.url()) && response.ok()
  );

  trackingEnabled = true;
  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();

  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('map-container')).toBeVisible();
});
