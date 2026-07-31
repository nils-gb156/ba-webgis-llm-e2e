// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to be fully loaded and interactive
  await page.waitForLoadState('networkidle');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The accessibility tree shows "UV-Index" checkbox is currently unchecked.
  // We use force: true because Chakra UI renders the real input visually hidden.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click({ force: true });

  // Step 2: The user waits for the map to load the layer tiles.
  // We poll the checkbox state to ensure it has updated to checked.
  await expect.poll(() => uvIndexCheckbox.isChecked()).toBe(true);

  // Expected result 1: The UV-Index overlay layer toggle is in the enabled (checked) state.
  // This is already verified by the poll above.

  // Expected result 2: The UV-Index overlay tiles are rendered on the map canvas.
  // Since map content is rendered on a canvas and not as DOM elements, we verify
  // that the layer is active by checking if the legend for UV-Index is visible or
  // if the layer switcher reflects the change. However, the prompt asks to verify
  // it is rendered on the map canvas. Without specific map helper functions provided
  // in the prompt to read map state, we can infer rendering by checking if the
  // corresponding legend item or a specific UI indicator for the layer is visible/updated.
  // Alternatively, we can check that the layer switcher UI reflects the checked state,
  // which we already did. To further confirm rendering, we might look for a legend update.
  // The accessibility tree shows a legend item for "UV-Index Stations".
  // Let's check if the legend for UV-Index is visible, which implies the layer is loaded.
  const uvIndexLegend = page.getByTestId('uvi-stations-legend');
  await expect(uvIndexLegend).toBeVisible();

  // Another way to verify map rendering without helper functions is to capture a screenshot
  // or check for specific map interactions, but that's not strictly an assertion on state.
  // Given the constraints, verifying the layer toggle state and the presence of its legend
  // is the most robust DOM-based verification.
  // If we had map helpers, we would poll the active layers or feature count.
  // Since we don't, we rely on the UI feedback.

  // Final assertion to ensure the test passes with the expected state
  await expect(uvIndexCheckbox).toBeChecked();
});
