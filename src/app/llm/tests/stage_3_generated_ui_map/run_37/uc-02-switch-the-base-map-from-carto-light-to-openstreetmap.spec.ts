// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: Carto Light should be active
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // The layer switcher is visible by default.
  // Locate the base map selector within the layer switcher.
  // Based on typical Chakra UI structures in this app, the base map selector
  // is often a radio group or a list within the layer switcher panel.
  const layerSwitcher = page.getByTestId('layer-switcher');

  // Attempt to find the base map selector. It might be labeled or have a specific test id.
  // If not explicitly listed in the auto-generated map, we look for common patterns.
  // Often, base maps are selected via radio buttons or a dropdown.
  // Let's look for a radio group or similar control inside the layer switcher.
  // Since specific test IDs for the base map selector aren't in the provided map,
  // we rely on role/text.
  
  // Try to find the base map selection area. It might be a fieldset or div with a label.
  // Let's try clicking on the layer switcher toggle if it wasn't visible, but it is visible by default.
  // We need to find the "Base Map" section or similar.
  
  // Assuming the base map selector is accessible via a role or text.
  // Let's look for a radio button group or similar.
  // If there's a specific test id for the base map selector, we would use it.
  // Since it's not in the list, we fall back to getByRole or getByText scoped to the layer switcher.
  
  // Let's assume there is a radio group for base maps.
  const baseMapRadioGroup = layerSwitcher.getByRole('radiogroup', { name: /Base Map/i });
  
  // If the above fails, try to find radio buttons by text "OpenStreetMap" inside the layer switcher
  const osmRadioButton = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap' });

  // Click the OpenStreetMap radio button
  await osmRadioButton.click({ force: true });

  // Verify that OpenStreetMap is now the active base layer
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
