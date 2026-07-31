// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user opens the base map selector in the layer switcher.
  // Assuming the layer switcher is visible and contains a base map selector button/area.
  // We look for a button or toggle that opens the base map selection.
  // Common pattern: A button labeled "Base map" or similar in the TOC/LayerSwitcher.
  const baseMapSelectorButton = page.getByRole('button', { name: 'Base map' });
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // After clicking the selector, a list or panel with base map options should appear.
  // We look for the option labeled 'OpenStreetMap'.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We verify that OpenStreetMap is now the active selection.
  // Depending on the UI, the selected item might be highlighted or the button text might change.
  // Assuming the button text updates to reflect the current base map or the option is marked as selected.
  await expect(openStreetMapOption).toBeVisible(); // Ensure it's still visible (or the selector closed)
  
  // Check if the base map selector button now reflects OpenStreetMap
  await expect(baseMapSelectorButton).toHaveText('OpenStreetMap');
});
