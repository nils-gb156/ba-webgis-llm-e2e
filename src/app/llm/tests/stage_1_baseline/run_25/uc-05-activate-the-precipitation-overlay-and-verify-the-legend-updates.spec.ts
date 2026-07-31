// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Locate the Precipitation overlay layer in the TOC.
  // Assuming the layer is identified by a test id or accessible name.
  // We look for a checkbox or toggle associated with "Precipitation".
  const precipitationLayerToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true }).first();

  // Check if the toggle is currently unchecked. If it's already checked, we skip the click.
  const isChecked = await precipitationLayerToggle.isChecked();
  if (!isChecked) {
    // Force click because Chakra UI checkboxes have a hidden input underneath a decorative element
    await precipitationLayerToggle.click({ force: true });
  }

  // Verify the toggle is now checked
  await expect(precipitationLayerToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // We look for text or a test id within the legend container that indicates "Precipitation".
  const legendContainer = page.getByTestId('legend');
  await expect(legendContainer.getByText('Precipitation')).toBeVisible();
});
