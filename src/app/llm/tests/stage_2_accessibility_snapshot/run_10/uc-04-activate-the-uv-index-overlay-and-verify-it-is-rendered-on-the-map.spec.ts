// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const uvIndexTileRequests: string[] = [];
  const uvIndexTileResponses: Array<{ status: number; contentType: string }> = [];

  const isUvIndexTileUrl = (url: string) => {
    const normalized = url.toLowerCase();
    const hasUvIndexIdentifier =
      normalized.includes('uv-index') ||
      normalized.includes('uv_index') ||
      normalized.includes('uvindex') ||
      normalized.includes('uvi') ||
      normalized.includes('uv');
    const isTileLikeRequest =
      normalized.includes('getmap') ||
      normalized.includes('service=wms') ||
      normalized.includes('/tile') ||
      normalized.includes('/tiles');

    return hasUvIndexIdentifier && isTileLikeRequest;
  };

  page.on('request', request => {
    if (isUvIndexTileUrl(request.url())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  page.on('response', response => {
    if (isUvIndexTileUrl(response.url())) {
      uvIndexTileResponses.push({
        status: response.status(),
        contentType: response.headers()['content-type']?.toLowerCase() ?? ''
      });
    }
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);
  await expect
    .poll(() =>
      uvIndexTileResponses.some(
        response =>
          response.status >= 200 &&
          response.status < 400 &&
          (response.contentType === '' ||
            response.contentType.startsWith('image/') ||
            response.contentType.includes('application/octet-stream'))
      )
    )
    .toBe(true);
});
