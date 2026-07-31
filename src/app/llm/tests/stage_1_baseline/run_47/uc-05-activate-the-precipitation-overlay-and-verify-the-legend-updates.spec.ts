// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher and legend to be visible as per preconditions
  const layerSwitcher = page.getByTestId('layer-switcher');
  const legend = page.getByTestId('legend');
  
  await expect(layerSwitcher).toBeVisible();
  await expect(legend).toBeVisible();

  // Locate the Precipitation overlay toggle.
  // Assuming the layer item has a test id or is identifiable by its label.
  // Using getByRole('checkbox') with the specific layer name.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  // Check current state: precondition says it is initially hidden (unchecked).
  // Click to enable it.
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();

  // Verify the toggle is now in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // Assuming the legend updates to show the new layer's entry.
  // We look for text "Precipitation" inside the legend container.
  const legendEntry = legend.getByText('Precipitation');
  await expect(legendEntry).toBeVisible();
});
