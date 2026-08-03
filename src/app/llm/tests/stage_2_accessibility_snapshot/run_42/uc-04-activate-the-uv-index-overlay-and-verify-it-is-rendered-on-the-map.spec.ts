// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const mapContainer = page.getByTestId('map-container');

  if (!(await layerSwitcher.isVisible())) {
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcher).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await page.waitForLoadState('networkidle');

  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexCheckbox).not.toBeChecked();

  const initialMapScreenshot = await mapContainer.screenshot({ animations: 'disabled' });

  const isUvIndexTileRequest = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    const mentionsUvIndexLayer =
      lowerUrl.includes('uv-index') ||
      lowerUrl.includes('uv_index') ||
      lowerUrl.includes('uvindex') ||
      lowerUrl.includes('uvi');
    const looksLikeMapTile =
      lowerUrl.includes('request=getmap') ||
      lowerUrl.includes('getmap') ||
      lowerUrl.includes('service=wms') ||
      lowerUrl.includes('bbox=') ||
      lowerUrl.includes('/tile/') ||
      lowerUrl.includes('/tiles/');
    const isLegendRequest = lowerUrl.includes('legend');

    return mentionsUvIndexLayer && looksLikeMapTile && !isLegendRequest;
  };

  const uvIndexTileRequests: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'image' && isUvIndexTileRequest(request.url())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    return (
      response.ok() &&
      response.request().resourceType() === 'image' &&
      isUvIndexTileRequest(response.url())
    );
  });

  await uvIndexCheckbox.click({ force: true });
  await expect(uvIndexCheckbox).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();
  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const currentMapScreenshot = await mapContainer.screenshot({ animations: 'disabled' });
    return currentMapScreenshot.equals(initialMapScreenshot);
  }).toBe(false);
});
