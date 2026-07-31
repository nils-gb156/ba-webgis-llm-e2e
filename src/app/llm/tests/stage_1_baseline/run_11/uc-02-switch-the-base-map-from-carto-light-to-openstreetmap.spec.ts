// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher
  // Assuming the layer switcher has a toggle/button to expand base map options
  const baseMapToggle = page.getByTestId('layer-switcher-base-map-toggle');
  await expect(baseMapToggle).toBeVisible();
  await baseMapToggle.click();

  // Wait for the base map selector panel to become visible
  const baseMapSelector = page.getByTestId('base-map-selector');
  await expect(baseMapSelector).toBeVisible();

  // Step 2: Select 'OpenStreetMap' as the base map
  const openStreetMapOption = page.getByTestId('base-map-option-openstreetmap');
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Assert that OpenStreetMap is now selected
  await expect(openStreetMapOption).toHaveAttribute('aria-selected', 'true');

  // Assert that Carto Light is no longer selected
  const cartoLightOption = page.getByTestId('base-map-option-carto-light');
  await expect(cartoLightOption).not.toHaveAttribute('aria-selected', 'true');
});
