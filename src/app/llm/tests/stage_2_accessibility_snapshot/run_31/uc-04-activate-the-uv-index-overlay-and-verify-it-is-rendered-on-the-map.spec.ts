// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();

  await expect(uvIndexCheckbox).not.toBeChecked();

  const beforeMapScreenshot = await mapContainer.screenshot();

  const isUvIndexOverlayRequest = (url: string) => {
    const normalizedUrl = url.toLowerCase();
    return (
      normalizedUrl.includes('uvindex') ||
      normalizedUrl.includes('uv_index') ||
      normalizedUrl.includes('uv-index') ||
      (normalizedUrl.includes('uvi') && !normalizedUrl.includes('station'))
    );
  };

  const uvIndexRequestUrls: string[] = [];
  page.on('request', request => {
    const resourceType = request.resourceType();
    const url = request.url();

    if (
      (resourceType === 'image' || resourceType === 'fetch' || resourceType === 'xhr') &&
      isUvIndexOverlayRequest(url)
    ) {
      uvIndexRequestUrls.push(url);
    }
  });

  const uvIndexResponsePromise = page.waitForResponse(response => {
    const resourceType = response.request().resourceType();
    return (
      (resourceType === 'image' || resourceType === 'fetch' || resourceType === 'xhr') &&
      isUvIndexOverlayRequest(response.url()) &&
      (response.ok() || response.status() === 304)
    );
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();

  const uvIndexResponse = await uvIndexResponsePromise;
  expect(uvIndexResponse.ok() || uvIndexResponse.status() === 304).toBe(true);

  await expect.poll(() => uvIndexRequestUrls.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const afterMapScreenshot = await mapContainer.screenshot();
    return afterMapScreenshot.equals(beforeMapScreenshot);
  }).toBe(false);
});
