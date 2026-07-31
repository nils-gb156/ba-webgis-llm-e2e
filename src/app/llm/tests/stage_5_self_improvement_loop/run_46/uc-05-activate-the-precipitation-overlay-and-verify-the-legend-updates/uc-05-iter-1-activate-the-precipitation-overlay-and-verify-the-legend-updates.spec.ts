// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is already open.
  // Chakra UI renders the real checkbox visually hidden under a decorative control.
  // Use force: true to click the role locator.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Verify the layer is actually rendered on the map via the helper.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 2. The user views the legend.
  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // The legend panel is already visible. Look for a heading containing "Precipitation".
  const legendHeading = page.getByRole('heading', { name: 'Precipitation' });
  await expect(legendHeading).toBeVisible();
});
