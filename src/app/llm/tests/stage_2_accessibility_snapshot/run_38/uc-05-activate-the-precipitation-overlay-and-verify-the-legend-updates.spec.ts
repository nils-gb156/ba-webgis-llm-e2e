// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open to access the Precipitation layer toggle
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherPressed === 'false') {
    await layerSwitcherToggle.click({ force: true });
  }

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // Ensure the legend panel is visible
  const legendToggle = page.getByRole('button', { name: 'Legend Switcher' });
  const isLegendPressed = await legendToggle.getAttribute('aria-pressed');
  if (isLegendPressed === 'false') {
    await legendToggle.click({ force: true });
  }

  // The legend should contain an entry for Precipitation.
  // We look for text that likely indicates the precipitation legend title or content.
  // Based on the context, the legend might have a heading or text like "Precipitation".
  // We will assert that the legend panel contains text related to Precipitation.
  const legend = page.getByTestId('legend');
  
  // Use expect.poll to wait for the legend to update with the new layer
  await expect.poll(() => 
    legend.locator('text=Precipitation').first().isVisible()
  ).toBeTruthy();
});
