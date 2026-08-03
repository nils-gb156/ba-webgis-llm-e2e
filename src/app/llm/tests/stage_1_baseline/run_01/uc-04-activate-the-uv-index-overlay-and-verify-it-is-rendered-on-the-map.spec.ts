// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isUvIndexRequest = (url: string) => {
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    return (
      decodedUrl.includes('uv-index') ||
      decodedUrl.includes('uv_index') ||
      decodedUrl.includes('uvindex') ||
      (decodedUrl.includes('getmap') && decodedUrl.includes('uv') && decodedUrl.includes('index'))
    );
  };

  const uvIndexLayerLabel = page.getByText('UV-Index', { exact: true });
  await expect(uvIndexLayerLabel).toBeVisible();

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).not.toBeChecked();

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const mapBeforeOverlay = await mapViewport.screenshot();

  const uvTileRequests: string[] = [];
  page.on('request', request => {
    if (isUvIndexRequest(request.url())) {
      uvTileRequests.push(request.url());
    }
  });

  const uvTileResponsePromise = page.waitForResponse(response => {
    return isUvIndexRequest(response.url()) && response.ok();
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  const uvTileResponse = await uvTileResponsePromise;
  expect(uvTileResponse.ok()).toBeTruthy();

  await expect.poll(() => uvTileRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const mapAfterOverlay = await mapViewport.screenshot();
    return mapAfterOverlay.equals(mapBeforeOverlay);
  }).toBe(false);
});
