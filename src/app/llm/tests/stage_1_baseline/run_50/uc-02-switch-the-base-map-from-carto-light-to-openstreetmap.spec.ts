// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher (TOC) is visible by default. We look for the base map selector button.
  // Assuming a test id for the base map toggle/selector in the TOC.
  const baseMapToggle = page.getByTestId('layer-switcher-base-map-toggle');
  await expect(baseMapToggle).toBeVisible();
  await baseMapToggle.click();

  // Wait for the base map selection panel/list to appear
  const baseMapPanel = page.getByTestId('layer-switcher-base-map-list');
  await expect(baseMapPanel).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  const osmOption = page.getByTestId('base-map-option-openstreetmap');
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Assert that OpenStreetMap is selected
  await expect(osmOption).toHaveAttribute('aria-selected', 'true');

  // Assert that Carto Light is no longer selected
  const cartoLightOption = page.getByTestId('base-map-option-carto-light');
  await expect(cartoLightOption).toHaveAttribute('aria-selected', 'false');
});
