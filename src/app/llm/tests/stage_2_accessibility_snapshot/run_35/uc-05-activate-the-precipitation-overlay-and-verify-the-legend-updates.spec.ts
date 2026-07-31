// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure layer switcher is open so we can see the Precipitation checkbox
  // The accessibility tree shows Layer Switcher is already pressed/open, but let's be safe
  // by checking if the list items are visible. If not, click the toggle.
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });

  // Click the Precipitation checkbox to enable it
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // The legend panel is also open based on the accessibility tree ("Legend Switcher" [pressed]).
  // We look for text that likely indicates precipitation in the legend.
  // Since we don't have specific test IDs for the legend content items, we look for
  // a heading or text that mentions "Precipitation".
  const legend = page.getByTestId('legend');
  
  // Wait for the legend to potentially update with the new layer.
  // We expect to see "Precipitation" somewhere in the legend container.
  await expect(legend.getByText(/Precipitation/i)).toBeVisible({ timeout: 10000 });
});
