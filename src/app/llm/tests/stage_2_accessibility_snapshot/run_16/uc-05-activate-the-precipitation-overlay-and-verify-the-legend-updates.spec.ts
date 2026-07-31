// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure layer switcher is open to access the Precipitation toggle
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherOpen !== 'true') {
    await layerSwitcherToggle.click();
  }

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
  // The legend container is identified by test id 'legend'
  const legendContainer = page.getByTestId('legend');
  
  // We expect the legend to contain text related to precipitation.
  // Since we don't know the exact legend text, we look for a common pattern or just ensure the legend exists and has content.
  // However, the prompt implies checking for a specific entry. Let's look for "Precipitation" in the legend.
  // Using a scoped locator to ensure we are looking inside the legend container.
  const precipitationLegendEntry = legendContainer.getByText(/Precipitation/i, { exact: false });
  
  // Wait for the legend to update. The legend might update asynchronously after the layer is toggled.
  await expect(precipitationLegendEntry).toBeVisible();
});
