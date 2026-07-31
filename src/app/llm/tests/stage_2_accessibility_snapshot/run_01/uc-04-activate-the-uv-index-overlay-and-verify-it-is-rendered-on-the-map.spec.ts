// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to be fully loaded and interactive
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index checkbox is initially unchecked.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox to enable the layer
  await uvIndexCheckbox.click({ force: true });

  // Step 2: The user waits for the map to load the layer tiles.
  // We verify the layer is requested and rendered by checking the checkbox state and waiting for a network response
  // that indicates the layer tiles are being fetched.

  // Assert the UV-Index overlay layer toggle is in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the UV-Index layer tiles to be requested and loaded.
  // We listen for a request to a WMS or tile service that likely contains "uv" or "uvi" in the URL.
  const uvTileResponse = page.waitForResponse((response) => {
    const url = response.url();
    return (
      url.includes('uv') ||
      url.includes('UVI') ||
      url.includes('uvi')
    );
  });

  // Trigger the actual tile loading by clicking on the map to refresh the view or just wait for the response
  // Since the layer was just toggled, the map might automatically reload the tiles.
  // We click the map to ensure any pending interactions are processed and new tiles are requested.
  await page.getByTestId('map-container').click({ position: { x: 100, y: 100 } });

  await uvTileResponse;

  // Assert the UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert canvas content, we rely on the successful network response
  // and the fact that the layer is checked. Additionally, we can check for the legend entry
  // to ensure the layer is recognized as active.
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
});
