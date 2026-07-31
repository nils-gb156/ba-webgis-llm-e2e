// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to be fully loaded and stable
  await page.waitForLoadState('networkidle');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is already open. We locate the UV-Index checkbox by its accessible name.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click();

  // Step 2: Wait for the map to load the layer tiles.
  // We wait for the checkbox to be checked, which indicates the UI has updated.
  await expect(uvIndexCheckbox).toBeChecked();

  // Expected result 1: The UV-Index overlay layer toggle is in the enabled (checked) state.
  // This is already asserted above with toBeChecked().

  // Expected result 2: The UV-Index overlay tiles are rendered on the map canvas.
  // Since map tiles are rendered on a canvas, we cannot assert DOM elements directly.
  // However, we can assert that the UV-Index legend is visible, which implies the layer is active.
  // Alternatively, we can wait for a network request to the WMS service for the UV-Index layer.
  // Let's try to assert the visibility of the UV-Index legend item as a proxy for the layer being rendered.
  const uvIndexLegend = page.getByTestId('uvi-stations-legend');
  await expect(uvIndexLegend).toBeVisible();

  // Additionally, we can check that the map canvas has changed by taking a screenshot or checking for specific visual cues if available.
  // For now, the visibility of the legend and the checked state of the checkbox are strong indicators.
  // To be more thorough, we can also wait for a network request to the WMS endpoint for UV-Index.
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().includes('UV-Index') || response.url().includes('uv-index')),
    page.waitForLoadState('networkidle') // Ensure any pending requests are done
  ]);

  // Assert that the response was successful
  await expect(response.status()).toBe(200);
});
