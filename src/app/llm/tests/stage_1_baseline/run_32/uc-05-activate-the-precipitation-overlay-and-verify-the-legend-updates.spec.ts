// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the Precipitation overlay layer toggle in the layer switcher.
  // Assuming the layer switcher items have test ids or accessible names.
  // We look for a checkbox associated with "Precipitation".
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });

  // Ensure the toggle is initially hidden (unchecked)
  await expect(precipitationToggle).not.toBeChecked();

  // Click the visibility toggle to show the Precipitation overlay
  // Using force: true as Chakra UI checkboxes may have visual overlays intercepting clicks
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Locate the legend container
  await expect(page.getByTestId('legend')).toBeVisible();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // We check for text "Precipitation" within the legend.
  await expect(page.getByTestId('legend').getByText('Precipitation')).toBeVisible();
});
