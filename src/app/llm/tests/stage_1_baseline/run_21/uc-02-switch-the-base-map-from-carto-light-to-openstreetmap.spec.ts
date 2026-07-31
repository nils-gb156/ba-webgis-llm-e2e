// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher
  // The layer switcher (TOC) is assumed to be visible by default.
  // We look for a button or toggle that opens the base map selector.
  // Based on common patterns, this might be a button labeled "Base Map" or similar.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Assuming there's a button to open the base map selector within the TOC
  // If not explicitly named, we might need to click a specific area.
  // Let's assume a button with text "Base Map" or a test id for the selector trigger.
  // Since no specific test id is provided for the trigger, we'll try getByRole.
  const baseMapSelectorTrigger = page.getByRole('button', { name: 'Base Map' });
  await expect(baseMapSelectorTrigger).toBeVisible();
  await baseMapSelectorTrigger.click();

  // Wait for the base map selection panel/list to appear
  // Assuming the selector opens a dropdown or a panel.
  // We'll look for a list or items representing base maps.
  const baseMapList = page.getByRole('list', { name: /Base Map/i });
  await expect(baseMapList).toBeVisible();

  // Step 2: Select 'OpenStreetMap' as the base map
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.

  // Assert that OpenStreetMap is now selected
  await expect(openStreetMapOption).toHaveAttribute('aria-selected', 'true');

  // Assert that Carto Light is no longer selected
  const cartoLightOption = page.getByRole('option', { name: 'Carto Light' });
  await expect(cartoLightOption).toHaveAttribute('aria-selected', 'false');
});
