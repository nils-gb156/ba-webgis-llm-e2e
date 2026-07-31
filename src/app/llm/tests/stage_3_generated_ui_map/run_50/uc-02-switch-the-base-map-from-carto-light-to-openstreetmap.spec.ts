// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the default base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the base map selector in the layer switcher.
  // The layer switcher is visible by default. We look for the base map selector within it.
  // Based on typical Chakra UI patterns in Open Pioneer, the base map selector is often a group of radio buttons or similar.
  // We will click on the layer switcher toggle if it's not already open, but the prompt says it's visible by default.
  // We need to find the base map selector. Usually, there's a specific section or button to expand base maps.
  // Looking at the UI map, there isn't a specific "base-map-selector" test id.
  // However, the layer switcher is visible. We need to find the radio buttons or similar for base maps.
  // Let's assume the base map selection is done via radio buttons inside the layer switcher.
  // We will look for radio buttons with names like "Carto Light", "OpenStreetMap", etc.
  
  // First, ensure the layer switcher is open. It is visible by default, but let's make sure the base map section is expanded if needed.
  // Often, the base map selector is a collapsible section. Let's look for a button or section header that says "Base Map" or similar.
  // Since we don't have specific test IDs for the base map selector, we'll rely on the fact that the layer switcher is open.
  // We will try to find radio buttons for the base maps.
  
  // Let's try to find the radio button for "OpenStreetMap" directly. If it's not visible, we might need to expand a section.
  // However, the prompt says "The user opens the base map selector". This implies there's a specific action to open it.
  // Let's look for a button or element that toggles the base map selector.
  // In many GIS apps, the base map selector is a separate panel or a section within the layer switcher.
  // Let's assume there is a radio button group for base maps.
  
  // We will click on the radio button for "OpenStreetMap".
  // If the base map selector is not open, we need to open it first.
  // Let's look for a button that might open the base map selector.
  // Since we don't have a specific test ID, we'll try to find a radio button for "OpenStreetMap".
  // If it's not visible, we might need to click on a parent element to expand the base map section.
  
  // Let's try to find the radio button for "OpenStreetMap".
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap' });
  
  // If the radio button is not visible, we might need to expand the base map selector.
  // Let's check if the radio button is visible. If not, we'll try to find a button to expand it.
  // Since we don't have a specific test ID for the base map selector, we'll assume it's already visible or we can click on the layer switcher to expand it.
  // Let's try to click on the radio button. If it's not visible, we'll get an error.
  // To handle this, we'll first check if the radio button is visible. If not, we'll try to find a button to expand the base map section.
  
  // Let's try to find a button that says "Base Map" or similar to expand the section.
  // Since we don't have a specific test ID, we'll try to find a button with text "Base Map".
  const baseMapSectionButton = page.getByRole('button', { name: 'Base Map' });
  
  // If the base map section button is visible, click it to expand the base map selector.
  if (await baseMapSectionButton.isVisible()) {
    await baseMapSectionButton.click();
  }
  
  // Now, click on the "OpenStreetMap" radio button.
  await openStreetMapRadio.click();
  
  // Wait for the base layer to change to OpenStreetMap.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
  
  // Assert that Carto Light is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
