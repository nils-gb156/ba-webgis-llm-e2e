// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial state to be ready
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // 1. Open the base map selector in the layer switcher.
  // The layer switcher is visible by default. We need to find the base map selector.
  // Based on typical layer switcher implementations, there's usually a section or button for base maps.
  // Looking at the UI map, we have `layer-switcher-toggle` but the switcher is visible by default.
  // We need to look for the base map selection UI inside the layer switcher.
  // Since no specific test id for the base map selector is provided, we look for role/text.
  // Often, base maps are selected via a group of radio buttons or a dropdown.
  // Let's assume there's a way to interact with base layers.
  // If there's no explicit "Base Map" label, we might need to look for the list of base maps.
  // However, without specific test ids or clear roles, we might need to rely on the layer switcher content.
  // Let's look for a button or section that allows changing base maps.
  // If the UI has a "Base Maps" header or similar, we can use that.
  // Let's try to find the OpenStreetMap option directly if it's visible, or the toggle to show base maps.
  // Since the prompt says "The user opens the base map selector", there must be an interactive element for this.
  // Let's look for a button or link with text "Base Maps" or similar, or perhaps the layer switcher has a specific mode.
  // If not, we might need to look for the OpenStreetMap layer in the list and click it.
  // Let's assume there is a "Base Maps" toggle or section.
  // If we can't find a specific "Base Maps" toggle, we might look for the OpenStreetMap option directly.
  // Let's try to find the OpenStreetMap layer option.
  
  // Attempting to find the base map selector. If it's a radio group, we can click the radio button.
  // Let's look for a radio button or checkbox with text "OpenStreetMap".
  // Or a button.
  
  // Since the UI map doesn't specify a test id for the base map selector, we fall back to getByRole/getByText.
  // We look for an element that allows selecting "OpenStreetMap".
  
  // Let's try to click on the layer switcher if it's not already in the right mode, but it's visible by default.
  // We look for the OpenStreetMap option.
  
  // If there's a "Base Maps" section, we might need to expand it.
  // Let's assume the OpenStreetMap option is clickable.
  
  // We will look for a role that represents a selectable item for "OpenStreetMap".
  // It could be a radio button, checkbox, or button.
  
  // Let's try to find the OpenStreetMap text and click its parent interactive element.
  // Or better, use getByRole('radio', { name: 'OpenStreetMap' }) or similar.
  
  // Since we don't know the exact role, let's look for the text "OpenStreetMap" in the layer switcher.
  // We scope it to the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Find the OpenStreetMap option. It might be a radio button.
  const osmOption = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true }).first();
  
  // If it's not a radio, it might be a button or checkbox.
  // Let's try to click it. If it fails, we might need to adjust.
  // But first, let's check if it's visible.
  await expect(osmOption).toBeVisible();
  
  // 2. Select 'OpenStreetMap' as the base map.
  await osmOption.click();

  // Expected results: The OpenStreetMap base map is selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

  // The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
