// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) and legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Locate the Precipitation overlay toggle.
  // We look for a checkbox/switch labeled "Precipitation" within the layer switcher.
  const precipitationToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });

  // Ensure the toggle is initially hidden (unchecked) as per preconditions
  await expect(precipitationToggle).not.toBeChecked();

  // Click the visibility toggle to show the Precipitation overlay
  // Using force: true because Chakra UI renders the input visually hidden
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer
  // We check that the legend container contains text or an element related to "Precipitation"
  const legend = page.getByTestId('legend');
  await expect(legend.getByText('Precipitation', { exact: false })).toBeVisible();
});
