// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher.
  // Assuming there is a toggle or button to open the base map selection panel.
  // Often this is a button labeled "Base Map" or similar within the TOC.
  const baseMapToggle = layerSwitcher.getByRole('button', { name: 'Base Map' });
  await expect(baseMapToggle).toBeVisible();
  await baseMapToggle.click();

  // Wait for the base map selection panel/list to appear
  const baseMapPanel = layerSwitcher.getByRole('list', { name: /base map/i });
  await expect(baseMapPanel).toBeVisible();

  // Step 2: Select 'OpenStreetMap' as the base map.
  // Locate the radio button or option for OpenStreetMap.
  const openStreetMapOption = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click({ force: true });

  // Expected results:
  // - The OpenStreetMap base map is selected.
  await expect(openStreetMapOption).toBeChecked();

  // - The Carto Light base map is no longer selected.
  const cartoLightOption = layerSwitcher.getByRole('radio', { name: 'Carto Light' });
  await expect(cartoLightOption).not.toBeChecked();
});
