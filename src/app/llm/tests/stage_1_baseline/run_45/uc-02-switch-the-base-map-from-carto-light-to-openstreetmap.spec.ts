// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher
  // Assuming the base map selector is a button or toggle within the layer switcher
  const baseMapSelector = page.getByTestId('base-map-selector');
  await expect(baseMapSelector).toBeVisible();
  await baseMapSelector.click();

  // Step 2: Select 'OpenStreetMap' as the base map
  // Assuming the list of base maps is rendered after clicking the selector
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We assert that OpenStreetMap is now the active selection
  await expect(page.getByRole('option', { name: 'OpenStreetMap', selected: true })).toBeVisible();

  // And that Carto Light is no longer selected
  await expect(page.getByRole('option', { name: 'Carto Light', selected: true })).not.toBeVisible();
});
