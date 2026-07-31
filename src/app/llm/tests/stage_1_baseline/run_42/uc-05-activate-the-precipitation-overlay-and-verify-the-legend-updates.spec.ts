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

  // Locate the Precipitation layer toggle in the layer switcher
  // Assuming the layer item has a test id or accessible name.
  // We look for a checkbox associated with "Precipitation".
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });

  // Ensure it is initially unchecked (hidden)
  await expect(precipitationToggle).not.toBeChecked();

  // Click the toggle to enable the Precipitation layer
  // Using force: true because Chakra UI checkboxes render the input visually hidden
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend updates to include an entry for the Precipitation layer.
  // We poll the legend content to ensure the async update has settled.
  await expect.poll(() => legend.getByText('Precipitation', { exact: false })).toBeVisible();
});
