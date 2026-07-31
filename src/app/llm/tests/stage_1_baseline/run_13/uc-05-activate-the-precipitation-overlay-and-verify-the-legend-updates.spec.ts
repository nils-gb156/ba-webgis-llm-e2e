// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher and legend to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Locate the Precipitation overlay toggle in the layer switcher
  // Assuming the Precipitation layer has a test id or is identifiable by text
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  
  // Check if the toggle is initially unchecked (precondition)
  // If it's already checked, we might need to uncheck it first, but the prompt says it's initially hidden.
  // We will force click to ensure it is checked, as Chakra UI checkboxes might intercept clicks.
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer
  // The legend entry might contain the text "Precipitation" or be associated with the layer
  const precipitationLegendEntry = legend.getByText('Precipitation', { exact: true });
  await expect(precipitationLegendEntry).toBeVisible();
});
