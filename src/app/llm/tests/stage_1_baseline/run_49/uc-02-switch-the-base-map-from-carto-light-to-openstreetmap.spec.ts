// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // Assuming the base map selector is a button or toggle within the layer switcher.
  // We look for a button that likely controls the base map visibility/selector.
  const baseMapSelectorButton = page.getByTestId('base-map-selector');
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Wait for the base map list/options to appear
  const baseMapList = page.getByTestId('base-map-list');
  await expect(baseMapList).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  // Or if it's a list item with text
  const openStreetMapListItem = page.getByText('OpenStreetMap');
  
  // Try to click the specific option/list item. 
  // Since we don't have exact test IDs for the options, we use text.
  // Ensure we are scoping or being specific if there are multiple "OpenStreetMap" texts.
  await openStreetMapListItem.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Assert that OpenStreetMap is selected. 
  // This might be reflected in the UI state of the selector button or a list item.
  // Let's check if the base map selector button reflects the new selection or if the list item is active.
  await expect(openStreetMapListItem).toHaveAttribute('aria-selected', 'true');
  
  // Assert that Carto Light is no longer selected.
  const cartoLightOption = page.getByText('Carto Light');
  await expect(cartoLightOption).not.toHaveAttribute('aria-selected', 'true');
});
