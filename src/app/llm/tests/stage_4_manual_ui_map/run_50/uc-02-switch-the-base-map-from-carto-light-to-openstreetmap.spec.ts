// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Verify Carto Light is active by default
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: Open the base map selector in the layer switcher
  // The layer switcher is visible by default, so we just need to find the dropdown
  const layerSwitcher = page.getByTestId('layer-switcher');
  // The base map selector is a dropdown within the layer switcher
  // We look for the dropdown control. Since it's a Chakra dropdown, we might need to click the trigger.
  // Assuming the dropdown has a test id or accessible name. If not, we look for the button inside layer-switcher.
  // Based on typical Chakra UI, the dropdown trigger is often a button.
  // Let's assume the dropdown itself is accessible or we click the first button in the layer switcher that acts as a selector.
  // However, the prompt says "opens the base map selector". Let's look for a dropdown role or a button labeled with the current selection.
  // Since we don't have specific test ids for the dropdown trigger in the UI map, we rely on accessible names.
  // The default is "Carto Light". So we look for a button with text "Carto Light" inside the layer switcher.
  const baseMapTrigger = layerSwitcher.getByRole('button', { name: 'Carto Light' });
  await baseMapTrigger.click();

  // Step 2: Select 'OpenStreetMap' as the base map
  // After clicking, a dropdown menu should appear with options.
  // We look for the option "OpenStreetMap".
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results:
  // The OpenStreetMap base map is selected.
  // The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
