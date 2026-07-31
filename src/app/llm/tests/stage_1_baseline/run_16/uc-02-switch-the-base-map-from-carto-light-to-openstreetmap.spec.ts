// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // 1. The user opens the base map selector in the layer switcher.
  // Assuming the base map selector is a button or toggle within the layer switcher.
  // We look for a button that might open the base map list.
  const baseMapSelectorButton = page.getByTestId('layer-switcher-base-map-selector');
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Wait for the base map list/options to appear
  // Assuming the list of base maps is rendered after clicking the selector
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();

  // 2. The user selects 'OpenStreetMap' as the base map.
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Check that OpenStreetMap is now selected in the UI
  const selectedBaseMapLabel = page.getByTestId('layer-switcher-selected-base-map-label');
  await expect(selectedBaseMapLabel).toHaveText('OpenStreetMap');

  // Verify Carto Light is no longer the selected base map
  // Depending on implementation, we might check that Carto Light is not selected
  // or simply that the label changed. We'll assert the label change which implies the switch.
  await expect(page.getByTestId('layer-switcher-selected-base-map-label')).not.toHaveText('Carto Light');
});
