// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  const mapCanvas = page.locator('canvas').first();

  await expect(uvIndexLabel).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();
  await expect(mapCanvas).toBeVisible();

  const isUvIndexTileRequest = (url: string, resourceType?: string) => {
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    const matchesLayerName =
      decodedUrl.includes('uv-index') ||
      decodedUrl.includes('uv_index') ||
      decodedUrl.includes('uv index') ||
      decodedUrl.includes('uvindex') ||
      decodedUrl.includes('uvi');
    const matchesTileLikeRequest =
      resourceType === 'image' || decodedUrl.includes('getmap') || decodedUrl.includes('tile');
    return matchesLayerName && matchesTileLikeRequest;
  };

  const uvIndexTileRequests: string[] = [];
  page.on('request', request => {
    if (isUvIndexTileRequest(request.url(), request.resourceType())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response =>
    isUvIndexTileRequest(response.url(), response.request().resourceType()) && response.ok()
  );

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  expect(uvIndexTileResponse.ok()).toBeTruthy();

  await expect(mapCanvas).toBeVisible();
});
