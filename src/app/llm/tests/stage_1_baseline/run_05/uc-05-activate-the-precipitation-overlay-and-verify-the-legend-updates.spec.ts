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
  // The layer is initially hidden, so we need to toggle it on.
  // We use force: true because Chakra UI checkbox controls may intercept clicks.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the legend updates to include the Precipitation layer
  // Wait for the legend to reflect the change. The legend entry for Precipitation should appear.
  const precipitationLegendEntry = page.getByTestId('legend-entry').getByText('Precipitation');
  await expect(precipitationLegendEntry).toBeVisible();

  // Verify the toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();
});
