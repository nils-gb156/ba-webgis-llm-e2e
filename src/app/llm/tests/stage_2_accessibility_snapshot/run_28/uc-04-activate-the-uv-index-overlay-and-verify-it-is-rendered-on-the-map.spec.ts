// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to fully load and the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Intercept WMS GetMap requests to verify the UV-Index layer is requested
  const wmsRequests: import('@playwright/test').Request[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('SERVICE=WMS') && url.includes('REQUEST=GetMap')) {
      wmsRequests.push(request);
    }
  });

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The layer switcher is already visible and the UV-Index checkbox is unchecked
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).not.toBeChecked();
  await uvIndexCheckbox.click();

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles
  // We expect at least one WMS GetMap request to have been sent for the newly activated layer
  await expect.poll(() => wmsRequests.length).toBeGreaterThan(0);

  // Verify that the UV-Index layer parameter is present in the WMS request
  const uvIndexRequest = wmsRequests.find((req) => req.url().includes('LAYERS=UV-Index'));
  expect(uvIndexRequest).toBeDefined();

  // Verify that the UV-Index legend is visible, confirming the layer is rendered/recognized
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
});
