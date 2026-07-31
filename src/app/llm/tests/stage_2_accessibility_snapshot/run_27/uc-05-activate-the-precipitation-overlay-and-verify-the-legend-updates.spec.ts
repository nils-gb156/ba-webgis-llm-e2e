// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open to interact with layer checkboxes
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherPressed !== 'true') {
    await layerSwitcherToggle.click({ force: true });
  }

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
  // The legend container is identified by test id 'legend'
  const legendContainer = page.getByTestId('legend');
  
  // We expect the legend to contain text or elements related to Precipitation.
  // Since the exact structure of the precipitation legend isn't provided in the context,
  // we check for the presence of "Precipitation" text within the legend container.
  await expect(legendContainer.getByText('Precipitation', { exact: false })).toBeVisible();
});
