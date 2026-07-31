// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The accessibility tree shows "UV-Index" checkbox is currently unchecked.
  // We use force: true because Chakra UI checkboxes have a hidden input.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click({ force: true });

  // Step 2: Wait for the map to load the layer tiles.
  // We wait for a WMS GetMap request which typically includes the layer name.
  // We also poll the checkbox state to ensure it is checked.
  await expect.poll(async () => {
    const isChecked = await uvIndexCheckbox.isChecked();
    return isChecked;
  }).toBe(true);

  // Verify the UV-Index overlay tiles are rendered on the map canvas.
  // We can do this by waiting for a successful WMS GetMap request for the UV-Index layer.
  // First, set up a listener for the request
  let wmsRequestReceived = false;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('LAYERS=UV-Index') && url.includes('SERVICE=WMS') && url.includes('REQUEST=GetMap')) {
      wmsRequestReceived = true;
    }
  });

  // Wait for the response to the WMS GetMap request
  const response = await page.waitForResponse((response) => {
    const url = response.url();
    return url.includes('LAYERS=UV-Index') && 
           url.includes('SERVICE=WMS') && 
           url.includes('REQUEST=GetMap') && 
           response.status() === 200;
  });

  // Assert that the response was successful
  await expect(response.status()).toBe(200);

  // Additionally, we can verify the UV-Index legend is visible, which indicates the layer is active
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
});
