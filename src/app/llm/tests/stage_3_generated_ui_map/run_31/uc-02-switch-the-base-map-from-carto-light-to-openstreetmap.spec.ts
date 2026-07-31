// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the base map selector in the layer switcher.
  // The layer switcher is visible by default. We look for the base map selector
  // within the layer switcher panel.
  const layerSwitcher = page.getByRole('region', { name: /layer switcher/i, exact: false }).or(page.getByTestId('layer-switcher'));
  
  // Click the base map selector button (often labeled "Base map" or similar inside the TOC)
  // Since we don't have a specific testid for the base map selector button, we look for a button
  // within the layer switcher that might trigger the base map list.
  // Based on typical UI, there might be a "Base map" toggle or list.
  // Let's try to find the base map selection area.
  // If there's no explicit testid, we might need to click a button that opens the base map list.
  // Let's assume there is a button or section for base maps.
  
  // Looking at the UI map, `layer-switcher` is a panel. `layer-switcher-toggle` is a button.
  // The prompt doesn't explicitly list a "base-map-selector" testid, but it lists `layer-switcher`.
  // Usually, the base map selector is part of the layer switcher content.
  // Let's look for a button or list item related to base maps.
  // If the UI has a specific "Base map" button, we click it.
  // If not, we might need to look for a list of base maps directly.
  
  // Let's try to find the "OpenStreetMap" option directly if it's visible, or click a selector first.
  // Common pattern: Click "Base map" button to open a list, then click "OpenStreetMap".
  
  // Attempt 1: Look for a button labeled "Base map" or similar within the layer switcher.
  const baseMapButton = layerSwitcher.getByRole('button', { name: /base map/i, exact: false });
  
  // If the button exists, click it to reveal the list.
  if (await baseMapButton.isVisible()) {
    await baseMapButton.click();
  }

  // Now select 'OpenStreetMap'
  // It might be a list item or a button.
  const osmOption = layerSwitcher.getByRole('button', { name: 'OpenStreetMap', exact: true }).or(
    layerSwitcher.getByRole('option', { name: 'OpenStreetMap', exact: true }).or(
      layerSwitcher.getByText('OpenStreetMap', { exact: true })
    )
  );

  // Wait for the option to be clickable/visible if it was hidden
  await expect(osmOption).toBeVisible({ timeout: 5000 });
  await osmOption.click();

  // Assert that the base map has changed to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
