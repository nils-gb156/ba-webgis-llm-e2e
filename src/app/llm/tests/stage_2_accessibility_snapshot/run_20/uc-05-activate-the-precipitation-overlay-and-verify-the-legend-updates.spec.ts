// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click();

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry for the Precipitation layer
  // The legend is already visible per preconditions.
  // We wait for the legend to contain an entry corresponding to the Precipitation layer.
  // Since we don't have the exact text of the Precipitation legend items,
  // we check for the presence of a legend item that likely contains "Precipitation" or similar keywords.
  // Given the context, the legend list items will update. We can check for a specific text or structure.
  // Let's assume the legend will show a heading or text related to "Precipitation".
  // We will poll the legend content to ensure it updates.
  
  // The legend container has data-testid 'legend'.
  // We look for text that indicates precipitation data, e.g., "Precipitation" or mm/h etc.
  // Since we don't know the exact legend text, we can check if a new legend item appears or if the existing list changes.
  // A safer bet is to check for the presence of "Precipitation" in the legend area.
  
  await expect.poll(async () => {
    const legendLocator = page.getByTestId('legend');
    // Check if the legend contains text related to precipitation
    // This might be a heading or a paragraph within the legend
    const hasPrecipitationLegend = await legendLocator.locator('text=Precipitation').isVisible();
    return hasPrecipitationLegend;
  }).toBeTruthy();
});
