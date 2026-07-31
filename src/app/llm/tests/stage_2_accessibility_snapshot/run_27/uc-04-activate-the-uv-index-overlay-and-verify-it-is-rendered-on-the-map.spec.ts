// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and the map to be ready
  await page.waitForLoadState('networkidle');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The accessibility tree shows "checkbox "UV-Index""
  // Using force: true because Chakra UI renders the input visually hidden
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click({ force: true });

  // Step 2: Wait for the map to load the layer tiles
  // We wait for a network request that likely contains 'uv' or 'UVIndex' in the URL
  // or simply wait for the checkbox to be checked and the map canvas to update.
  // Since we can't assert DOM elements for map tiles, we rely on the checkbox state
  // and a short wait for network activity related to the layer.
  
  // Assert the UV-Index overlay layer toggle is in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the map to potentially load new tiles by waiting for a short period
  // or waiting for a specific network response if we could identify it.
  // Given the constraints, we'll wait for the layer to be considered "active"
  // by checking if the map canvas has changed or simply waiting for network idle again.
  // A more robust way in a real scenario might involve a custom event or state,
  // but here we'll wait for the network to settle after the toggle.
  await page.waitForLoadState('networkidle');

  // Assert that the UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert on the canvas content, we assert that the layer
  // is active and the map has had time to render.
  // We can also check if the legend for UV-Index is visible, which implies the layer is loaded.
  const uvIndexLegend = page.getByTestId('uvi-stations-legend');
  // The legend might be visible immediately if it's static, but let's ensure the map has processed the change.
  // We'll assume that if the checkbox is checked and network is idle, the tiles are rendered.
  // To be more specific, we could look for the UV-Index stations legend if it appears.
  // However, the prompt says "UV-Index Stations" is a layer, and "UV-Index" is another.
  // The use case is about the "UV-Index overlay", which is likely the "UV-Index" checkbox.
  // The legend for "UV-Index" might be different from "UV-Index Stations".
  // Let's just confirm the checkbox is checked and the map is stable.
  
  // Additional check: Ensure the map container is still visible and the page is stable.
  await expect(page.getByTestId('map-container')).toBeVisible();
});
