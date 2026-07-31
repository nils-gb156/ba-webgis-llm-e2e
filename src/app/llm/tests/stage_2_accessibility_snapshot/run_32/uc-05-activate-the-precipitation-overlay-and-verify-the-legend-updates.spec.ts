// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is already visible and open based on the context.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: The user views the legend.
  // The legend is already visible based on the context.
  // We need to verify that the legend displays an entry corresponding to the Precipitation layer.
  // We will look for text that likely indicates precipitation in the legend.
  // Since we don't have a specific test id for the precipitation legend entry, we look for text.
  // Common precipitation legend labels might include "Precipitation" or specific units/ranges.
  // Let's check if the legend contains "Precipitation" or similar.
  
  // Wait for the legend to potentially update with the new layer.
  // We poll the legend content to see if it contains precipitation-related text.
  await expect.poll(() => page.getByTestId('legend').textContent()).toContain('Precipitation');
});
