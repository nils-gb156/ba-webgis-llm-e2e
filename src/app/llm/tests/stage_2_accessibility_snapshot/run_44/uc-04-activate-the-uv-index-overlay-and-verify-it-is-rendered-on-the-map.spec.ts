// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index checkbox is initially unchecked.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox directly. Since it's a Chakra UI control, we use force: true
  // to bypass the decorative overlay that intercepts pointer events.
  await uvIndexCheckbox.click({ force: true });

  // Step 2: The user waits for the map to load the layer tiles.
  // We wait for the checkbox to be checked, which indicates the layer was activated.
  await expect(uvIndexCheckbox).toBeChecked();

  // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
  // Already asserted above.

  // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
  // Since map canvas content cannot be directly asserted via DOM, we verify the layer
  // is active by checking the legend for the UV-Index layer appears or is visible,
  // or by waiting for a network request related to the layer.
  // A robust way is to wait for the UV-Index legend to be visible, as it typically
  // appears when the layer is active.
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();

  // Additionally, we can verify that the layer switcher still shows the checkbox as checked
  // to ensure state consistency.
  await expect(page.getByRole('checkbox', { name: 'UV-Index' })).toBeChecked();
});
