// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the layer switcher (TOC) to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Open the base map selector in the layer switcher
  // Assuming there is a test id for the base map selector toggle or button
  const baseMapSelectorButton = page.getByTestId('base-map-selector-button');
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Wait for the base map options to appear
  // Assuming the list of base maps is rendered within a container with a specific test id or role
  const baseMapList = page.getByTestId('base-map-list');
  await expect(baseMapList).toBeVisible();

  // Select 'OpenStreetMap' as the base map
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Verify that OpenStreetMap is now selected
  // Assuming the selected item is visually distinct or has an aria-selected attribute
  await expect(openStreetMapOption).toBeVisible();
  // Check if the option has an aria-selected="true" or similar state if available,
  // otherwise rely on the fact that it was clicked and the list might close or update.
  // A more robust check might be to assert that the map tiles have changed, but without map helpers,
  // we check the UI state.
  const selectedBaseMap = page.getByRole('option', { name: 'OpenStreetMap', selected: true });
  await expect(selectedBaseMap).toBeVisible();

  // Verify that Carto Light is no longer selected
  const cartoLightOption = page.getByRole('option', { name: 'Carto Light' });
  await expect(cartoLightOption).toBeVisible();
  const notSelectedCartoLight = page.getByRole('option', { name: 'Carto Light', selected: false });
  await expect(notSelectedCartoLight).toBeVisible();
});
