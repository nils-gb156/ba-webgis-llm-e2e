// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) and legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is initially hidden, so we need to click its checkbox to enable it.
  // Using force: true because Chakra UI checkboxes render visually hidden inputs.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click({ force: true });

  // Step 2: The user views the legend.
  // Verify that the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationToggle).toBeChecked();

  // Verify that the legend displays an entry corresponding to the Precipitation layer.
  // We look for an element within the legend that contains the text "Precipitation".
  const legend = page.getByTestId('legend');
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
