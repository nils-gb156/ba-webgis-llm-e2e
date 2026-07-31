// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher.
  // Assuming the base map selector is a button or toggle within the layer switcher.
  const baseMapSelectorButton = layerSwitcher.getByRole('button', { name: /Base Map/i });
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Wait for the base map selection panel/dropdown to appear.
  const baseMapPanel = page.getByTestId('base-map-selector');
  await expect(baseMapPanel).toBeVisible();

  // Step 2: Select 'OpenStreetMap' as the base map.
  const openStreetMapOption = baseMapPanel.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Verify OpenStreetMap is selected.
  await expect(openStreetMapOption).toBeVisible();
  await expect(openStreetMapOption).toHaveAttribute('aria-selected', 'true');

  // Verify Carto Light is no longer selected.
  const cartoLightOption = baseMapPanel.getByRole('option', { name: 'Carto Light' });
  await expect(cartoLightOption).toHaveAttribute('aria-selected', 'false');
});
