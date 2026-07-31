// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to fully load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer.
  // The accessibility tree shows "checkbox 'Precipitation'" inside the operational layers list.
  // Chakra UI checkboxes need force: true to click the underlying input.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: Verify the legend displays an entry corresponding to the Precipitation layer.
  // We wait for the legend to update and contain text indicating precipitation data.
  // Common legend text for precipitation might include "Precipitation" or specific units/ranges.
  // We look for a heading or text in the legend that mentions "Precipitation".
  await expect(page.getByTestId('legend').getByText('Precipitation', { exact: false })).toBeVisible();
});
