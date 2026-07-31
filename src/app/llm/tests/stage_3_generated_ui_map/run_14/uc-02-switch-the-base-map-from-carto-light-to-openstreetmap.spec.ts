// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: Carto Light should be active
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // Click the layer switcher toggle to ensure it's open (it is visible by default, but this ensures the panel is active)
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await layerSwitcherToggle.click();

  // Open the base map selector within the layer switcher
  // The layer switcher panel contains the base map selector.
  // We look for a button or control that allows switching base maps.
  // Based on typical UI, this might be a specific button or a dropdown within the layer switcher.
  // Assuming the layer switcher panel has a base map selector button or similar.
  // Let's look for a button that says "Base Map" or similar, or click the layer switcher if it's already open.
  // Since the layer switcher is visible by default, we might need to find the base map selector.
  // Let's assume there is a button to change base map.
  const baseMapSelector = page.getByRole('button', { name: /Base Map/i }).first();
  if (baseMapSelector.isVisible()) {
    await baseMapSelector.click();
  } else {
    // Fallback: maybe the layer switcher itself has the base map options directly visible
    // or we need to click a specific "Base Map" tab/section.
    // Let's try to find the OpenStreetMap option directly if the selector is not explicit.
    // However, the use case says "opens the base map selector".
    // Let's assume there is a button "Base Map" or similar.
    // If not found, we might need to look for a specific test id.
    // Since no specific test id is given for the base map selector button, we use role.
    // Let's try to find a button with "Base Map" in the layer switcher.
    const layerSwitcherPanel = page.getByRole('region', { name: 'Layer Switcher' }).first();
    if (layerSwitcherPanel.isVisible()) {
      const baseMapBtn = layerSwitcherPanel.getByRole('button', { name: /Base Map/i });
      if (baseMapBtn.isVisible()) {
        await baseMapBtn.click();
      }
    }
  }

  // Select OpenStreetMap
  // After clicking the selector, OpenStreetMap should be available.
  // It might be in a dropdown, a list, or a dialog.
  // Let's try to find it by text or role.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' }).first();
  if (openStreetMapOption.isVisible()) {
    await openStreetMapOption.click();
  } else {
    // Fallback: maybe it's a button or a list item
    const osmButton = page.getByRole('button', { name: 'OpenStreetMap' }).first();
    if (osmButton.isVisible()) {
      await osmButton.click();
    } else {
      // Last resort: try to find it in the layer switcher panel
      const layerSwitcherPanel = page.getByRole('region', { name: 'Layer Switcher' }).first();
      const osmInPanel = layerSwitcherPanel.getByRole('button', { name: 'OpenStreetMap' }).first();
      if (osmInPanel.isVisible()) {
        await osmInPanel.click();
      }
    }
  }

  // Verify the base map has changed to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
