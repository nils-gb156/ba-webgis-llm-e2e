// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is already visible and open.
  // Find the Precipitation checkbox and click it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).toBeVisible();
  
  // Click the checkbox. Since it's a Chakra UI checkbox, we use force: true to bypass the decorative element.
  await precipitationCheckbox.click({ force: true });

  // Step 2: Verify the legend updates
  // Expected result 1: The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Expected result 2: The legend displays an entry corresponding to the Precipitation layer.
  // We look for a legend entry that mentions "Precipitation".
  // The legend container is visible. We check for text within the legend that indicates the new layer.
  const legend = page.getByTestId('legend');
  
  // Poll for the legend to update with precipitation-related content.
  // The exact text might vary, but we expect some indication of the precipitation layer.
  // Common patterns: "Precipitation" in the heading or legend items.
  await expect.poll(async () => {
    const legendContent = await legend.textContent();
    return legendContent?.toLowerCase().includes('precipitation');
  }).toBeTruthy();
});
