// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and verify initial state (Carto Light)
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // The layer switcher is visible by default.
  // Open the base map selector. Based on typical Chakra UI accordion/panel behavior in TOC,
  // we look for a toggle or header that reveals base maps.
  // Since no specific test-id for the base map selector toggle is provided, we look for
  // the layer switcher panel and then interact with it.
  // However, looking at the UI map, `layer-switcher` is a panel. We need to find the
  // specific control to switch base maps. Often this is a radio group or a list.
  // Let's assume the user clicks on the base map section or a specific control.
  // Without a specific test-id for the base map selector button, we might need to use
  // getByRole or getByText.
  // Let's look for a button or role that allows switching.
  // Often, base maps are switched via a radio group inside the layer switcher.
  
  // If there's no explicit "Base Map" toggle, we might need to look for the base map options directly.
  // Let's try to find "OpenStreetMap" in the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Attempt to find and click the OpenStreetMap option.
  // It might be a radio button or a list item.
  // Let's look for text "OpenStreetMap" within the layer switcher.
  const osmOption = layerSwitcher.getByText('OpenStreetMap');
  
  // If it's not directly visible, it might be inside a collapsed section.
  // Let's assume for "easy" complexity that the base map selector is accessible.
  // If the layer switcher has a specific "Base Maps" section, we might need to expand it.
  // But often, the base maps are listed directly or via a radio group.
  
  // Let's try clicking the text "OpenStreetMap" if it's a clickable element.
  // If it's a radio button, getByRole('radio', { name: 'OpenStreetMap' }) is better.
  const osmRadio = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  
  // Check if the radio exists. If not, maybe it's a button or link.
  // Let's try the radio first.
  if (await osmRadio.count() > 0) {
    await osmRadio.click();
  } else {
    // Fallback: try clicking the text if it's a button/link
    await osmOption.click();
  }

  // Assert that the base layer has changed to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
