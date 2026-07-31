// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher/legend to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so we need to find its checkbox and click it.
  // Using force: true because Chakra UI checkboxes have a decorative overlay.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).toBeVisible();
  await precipitationToggle.click({ force: true });

  // Wait for the layer to become active/checked
  await expect(precipitationToggle).toBeChecked();

  // Step 2: View the legend and verify it displays an entry for the Precipitation layer
  // The legend should now contain an entry corresponding to the Precipitation layer.
  // We check for the presence of the layer name in the legend container.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
