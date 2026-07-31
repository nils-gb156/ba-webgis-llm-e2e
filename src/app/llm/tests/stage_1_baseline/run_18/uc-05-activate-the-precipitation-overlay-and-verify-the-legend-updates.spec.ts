// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher/legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Locate the Precipitation overlay layer in the layer switcher.
  // Assuming the layer item has a test id or accessible name containing "Precipitation".
  // We look for the checkbox associated with the Precipitation layer.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  // Ensure the toggle is initially unchecked (hidden) as per preconditions
  await expect(precipitationToggle).not.toBeChecked();

  // Click the visibility toggle to show the Precipitation overlay
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // Assuming the legend item has a test id or accessible name containing "Precipitation".
  const precipitationLegendEntry = page.getByRole('listitem', { name: 'Precipitation' });
  
  // Check if a specific legend entry exists. If the legend uses a list structure,
  // we might need to look for a list item or a specific element within the legend container.
  // Using getByTestId if available, otherwise relying on accessible name.
  const legendContainer = page.getByTestId('legend');
  const precipitationLegendItem = legendContainer.getByText('Precipitation');

  await expect(precipitationLegendItem).toBeVisible();
});
