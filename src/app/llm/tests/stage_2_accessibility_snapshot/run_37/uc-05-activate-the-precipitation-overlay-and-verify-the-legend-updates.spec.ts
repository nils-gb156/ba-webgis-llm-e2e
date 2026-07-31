// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure layer switcher is open to access the Precipitation checkbox
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed') === 'true';
  if (!isLayerSwitcherOpen) {
    await layerSwitcherToggle.click();
  }

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // Ensure legend is visible (it might be closed or open, but we need to see its content)
  const legendToggle = page.getByRole('button', { name: 'Legend Switcher' });
  const isLegendOpen = await legendToggle.getAttribute('aria-pressed') === 'true';
  if (!isLegendOpen) {
    await legendToggle.click();
  }

  // The legend container
  const legendContainer = page.getByTestId('legend');

  // Wait for the legend to update and contain Precipitation related content
  // We look for text that indicates precipitation data, e.g., specific ranges or labels
  // Since the exact legend text for Precipitation isn't in the initial context, we assert that the legend
  // contains some precipitation-related text or that the legend structure has updated.
  // A safer bet is to wait for the legend to reflect the new layer.
  // Let's poll for the presence of precipitation-related text in the legend.
  // Common precipitation legend labels might be "Precipitation" or specific units like "mm/h".
  // We will check if the legend contains "Precipitation" or if the legend list items have changed.
  
  // Alternative: Check if the legend container has updated content by waiting for a specific pattern.
  // Since we don't know the exact legend text for Precipitation, we can assert that the legend
  // is visible and then check for any text that might indicate precipitation.
  // However, the requirement is to verify the legend displays an entry corresponding to the Precipitation layer.
  // Let's assume the legend will show "Precipitation" or similar.
  
  await expect.poll(() => legendContainer.getByText(/Precipitation/i).count()).toBeGreaterThan(0);
});
