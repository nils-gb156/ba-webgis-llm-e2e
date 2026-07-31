// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible as per preconditions
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // Assuming the base map selector is a button or toggle within the layer switcher.
  // We look for a button that might open the base map list.
  const baseMapSelector = page.getByTestId('base-map-selector');
  await expect(baseMapSelector).toBeVisible();
  await baseMapSelector.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We look for the 'OpenStreetMap' option within the now-visible selector/list.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We assert that OpenStreetMap is now active.
  await expect(page.getByRole('option', { name: 'OpenStreetMap', selected: true })).toBeVisible();

  // We assert that Carto Light is no longer selected.
  const cartoLightOption = page.getByRole('option', { name: 'Carto Light' });
  await expect(cartoLightOption).not.toBeAttached(); // Or not selected if it remains in DOM
  // If the list closes after selection, we might just check that OSM is the active one.
  // Let's verify the active state more robustly if possible, or just that OSM is selected.
  await expect(page.getByRole('option', { name: 'OpenStreetMap' })).toHaveAttribute('aria-selected', 'true');
});
