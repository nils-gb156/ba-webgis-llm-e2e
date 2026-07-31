// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the initial base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is visible by default.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // The base map selector is a dropdown within the layer switcher.
  // We look for a dropdown control. Since specific test ids for the dropdown trigger
  // aren't provided, we look for the dropdown within the layer switcher.
  // Chakra UI dropdowns often render as buttons or have accessible names.
  // We'll look for a button or role that represents the base map selector.
  // Based on the UI map, it's a dropdown with options.
  // We assume there is a visible element representing the current selection or a trigger.
  // Let's try to find the dropdown by its context.
  const baseMapDropdown = layerSwitcher.getByRole('button', { name: /Carto Light/i }).first();
  await baseMapDropdown.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // The dropdown should now be open. We select the option.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
