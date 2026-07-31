// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) and legend to be visible as per preconditions
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Locate the Precipitation overlay layer toggle.
  // Assuming the layer switcher uses checkboxes for visibility toggles.
  // We need to find the checkbox associated with "Precipitation".
  // Since exact text might be ambiguous, we scope to the layer switcher.
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation' });

  // Check current state to ensure it's initially hidden (unchecked) as per precondition
  await expect(precipitationToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
  // Using force: true because Chakra UI checkboxes have a hidden input and a visible control element.
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationToggle).toBeChecked();

  // Step 2: The user views the legend.
  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We assert that the legend contains text or an element related to "Precipitation".
  await expect(legend).toContainText('Precipitation');
});
