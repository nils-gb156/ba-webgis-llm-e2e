// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Verify the layer switcher is visible and the base map is Carto Light
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The accessibility tree identifies a combobox "Basemaps": Carto Light.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // Wait for the dropdown to appear and then click the option.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // The OpenStreetMap base map is selected.
  // The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
