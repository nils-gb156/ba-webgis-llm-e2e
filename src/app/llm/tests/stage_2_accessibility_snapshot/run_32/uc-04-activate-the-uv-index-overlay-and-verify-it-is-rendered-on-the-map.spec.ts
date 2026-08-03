// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const mapContainer = page.getByTestId('map-container');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const mapBefore = await mapContainer.screenshot();

  const uvIndexRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/(uv-?index|uvi)/i.test(url)) {
      uvIndexRequests.push(url);
    }
  });

  const uvIndexResponsePromise = page.waitForResponse((response) => {
    return response.ok() && /(uv-?index|uvi)/i.test(response.url());
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await uvIndexResponsePromise;
  await page.waitForLoadState('networkidle');

  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const mapAfter = await mapContainer.screenshot();
    return !mapAfter.equals(mapBefore);
  }).toBe(true);
});
