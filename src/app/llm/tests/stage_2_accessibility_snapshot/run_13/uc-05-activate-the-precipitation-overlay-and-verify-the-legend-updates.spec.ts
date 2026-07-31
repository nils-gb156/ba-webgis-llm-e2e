// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
  // The accessibility tree shows "checkbox 'Precipitation' [unchecked]".
  // We use force: true because Chakra UI checkboxes have a hidden input intercepted by a decorative element.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Step 2: The user views the legend.
  // Expected results:
  // - The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // - The legend displays an entry corresponding to the Precipitation layer.
  // We look for a legend entry that likely contains "Precipitation" in its heading or text.
  // Since we don't have a specific test-id for the precipitation legend item, we search by text within the legend container.
  const legendContainer = page.getByTestId('legend');
  
  // Use expect.poll to wait for the legend to update asynchronously after the layer toggle
  await expect.poll(() => legendContainer.getByText(/Precipitation/i).count()).toBeGreaterThan(0);
});
