// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible and expanded (it starts expanded per context)
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).toBeChecked({ checked: false });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry for the Precipitation layer
  await expect(page.getByTestId('legend')).toBeVisible();

  // Check if the legend contains an entry corresponding to the Precipitation layer.
  // We look for text that indicates precipitation data, e.g., "Precipitation" or specific units like "mm/h".
  // Since the exact legend text isn't provided in the prompt, we check for the presence of a new legend item
  // that wasn't there before, or specifically for "Precipitation" if it appears in the legend title/text.
  // A safe bet is to look for "Precipitation" in the legend container.
  await expect(page.getByTestId('legend').getByText(/Precipitation/i)).toBeVisible();
});
