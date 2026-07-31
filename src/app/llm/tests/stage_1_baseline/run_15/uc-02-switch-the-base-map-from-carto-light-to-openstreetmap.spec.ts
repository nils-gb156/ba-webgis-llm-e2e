// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // Locate the base map selector toggle/button within the layer switcher.
  const baseMapSelector = layerSwitcher.getByRole('button', { name: 'Base Map' });
  await expect(baseMapSelector).toBeVisible();
  await baseMapSelector.click();

  // Wait for the base map selection panel/list to appear
  const baseMapPanel = layerSwitcher.getByRole('list', { name: /Base Map/i });
  await expect(baseMapPanel).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  const openStreetMapOption = baseMapPanel.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Assert that OpenStreetMap is now selected
  const selectedOpenStreetMap = baseMapPanel.getByRole('option', { name: 'OpenStreetMap', exact: true });
  await expect(selectedOpenStreetMap).toHaveAttribute('aria-selected', 'true');

  // Assert that Carto Light is no longer selected
  const cartoLightOption = baseMapPanel.getByRole('option', { name: 'Carto Light' });
  await expect(cartoLightOption).toHaveAttribute('aria-selected', 'false');
});
