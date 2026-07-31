// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher
  // Assuming the base map selector is a button or toggle within the layer switcher
  const layerSwitcher = page.getByTestId('layer-switcher');
  const baseMapSelectorButton = layerSwitcher.getByRole('button', { name: /base map/i });
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Wait for the base map list or options to appear
  // Assuming the options are rendered as a list or set of buttons within the switcher
  const osmOption = layerSwitcher.getByRole('button', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();

  // Step 2: Select 'OpenStreetMap' as the base map
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We assert that OpenStreetMap is now active/selected in the UI
  await expect(osmOption).toHaveAttribute('aria-pressed', 'true');
  
  // Assert that Carto Light is no longer selected
  const cartoLightOption = layerSwitcher.getByRole('button', { name: 'Carto Light' });
  await expect(cartoLightOption).toHaveAttribute('aria-pressed', 'false');
});
