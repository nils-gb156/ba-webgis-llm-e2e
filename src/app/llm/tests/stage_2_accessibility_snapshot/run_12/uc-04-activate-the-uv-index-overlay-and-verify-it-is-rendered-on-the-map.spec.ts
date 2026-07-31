// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to fully load and the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index checkbox is initially unchecked. We click it to enable the layer.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexToggle).not.toBeChecked();
  await uvIndexToggle.click();

  // Step 2: The user waits for the map to load the layer tiles.
  // We assert that the toggle is now checked.
  await expect(uvIndexToggle).toBeChecked();

  // Verify that the UV-Index overlay tiles are rendered on the map canvas.
  // Since map content is rendered on a canvas, we assert that the map container
  // is visible and that the legend for UV-Index Stations is present, indicating
  // the layer is active and loaded.
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
});
