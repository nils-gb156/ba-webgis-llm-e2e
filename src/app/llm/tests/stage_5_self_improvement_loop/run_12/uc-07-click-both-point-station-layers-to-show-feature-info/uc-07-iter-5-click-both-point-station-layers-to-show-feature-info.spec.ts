// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates.
  const mapContainer = page.getByTestId('map-container');

  // Register request listeners before triggering the action.
  const requests: { url: string; postData?: string }[] = [];
  page.on('request', (request) => {
    if (request.url().includes('GetFeatureInfo')) {
      requests.push({ url: request.url(), postData: request.postData() });
    }
  });

  await mapContainer.click({ position: { x: 1188692.84, y: 6767643.28 } });

  // Wait for the GetFeatureInfo responses to complete.
  await page.waitForResponse(
    (response) =>
      response.url().includes('GetFeatureInfo') &&
      (response.request().postData()?.includes('UV-Index') === true ||
        response.request().postData()?.includes('EUCOS') === true),
    { timeout: 10000 },
  );

  // Verify the info panel displays sections for both station types.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();

  // Verify both GetFeatureInfo requests were sent for the correct layers.
  const uviRequest = requests.find(
    (r) => r.postData?.includes('UV-Index') === true,
  );
  const eucosRequest = requests.find(
    (r) => r.postData?.includes('EUCOS') === true,
  );
  expect(uviRequest).toBeDefined();
  expect(eucosRequest).toBeDefined();
});
