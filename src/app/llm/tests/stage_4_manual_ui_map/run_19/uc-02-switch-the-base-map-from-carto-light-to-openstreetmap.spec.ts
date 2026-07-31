// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the default base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // 1. The user opens the base map selector in the layer switcher.
  // The layer switcher is visible by default, so we locate the dropdown directly.
  const baseMapDropdown = page.getByTestId('basemaps-dropdown');
  await expect(baseMapDropdown).toBeVisible();
  
  // Clicking the dropdown should reveal the options.
  await baseMapDropdown.click();

  // 2. The user selects 'OpenStreetMap' as the base map.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
