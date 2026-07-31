// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map model to be ready and Carto Light to be active
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // Step 1: Open the base map selector in the layer switcher
  // The layer switcher is visible by default. We need to find the base map selector.
  // Based on typical patterns, the layer switcher panel contains the base map options.
  // We look for a button or section that allows switching base maps.
  // Since no specific testid for "base map selector" is listed, we look for the layer switcher toggle if it wasn't open,
  // but it is open by default. We need to find the base map list.
  // Often, base maps are listed in the layer switcher. Let's look for "OpenStreetMap" text or a role within the layer switcher.
  // However, the UI map doesn't explicitly list a base map selector button.
  // Let's assume the layer switcher panel contains the base map options.
  // We will look for a button or element that might trigger the base map selection or directly for the OpenStreetMap option if visible.
  // Given the complexity of UI auto-generation, let's look for the layer switcher panel and then search for OpenStreetMap.
  
  // The layer switcher panel is likely identified by its content or a specific testid if available.
  // The UI map lists `layer-switcher` as a panel visible by default.
  // Let's click on the layer switcher toggle if it's closed, but it's open.
  // We need to find the base map selector. Often this is a specific component.
  // Let's try to find "OpenStreetMap" within the layer switcher panel and click it.
  // If it's not directly clickable, we might need to click a "Base Map" header or similar.
  
  // Let's look for a button or link with text "OpenStreetMap" inside the layer switcher.
  // If that fails, we might need to click a generic base map selector.
  
  // Alternative: The layer switcher might have a specific "Base Maps" section.
  // Let's try to find the "OpenStreetMap" option.
  
  // Since the UI map is auto-generated, let's assume there is a way to interact with the layer switcher.
  // Let's look for a button that says "OpenStreetMap" or similar.
  
  // If we can't find a direct testid, we use getByText or getByRole.
  // Let's try to find the OpenStreetMap option in the layer switcher.
  
  // Step 1: Open base map selector (if not already open or if it requires a click to show options)
  // The layer switcher is open. We need to find the base map options.
  // Let's look for a button or element that represents the base map selector.
  // If there's no specific testid, we might need to click on the layer switcher panel to expand base maps if they are collapsed.
  // However, the UI map doesn't specify base maps are collapsed.
  
  // Let's assume the base map options are visible or can be accessed via the layer switcher.
  // We will look for "OpenStreetMap" text within the layer switcher panel.
  
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Try to find OpenStreetMap within the layer switcher
  const openStreetMapOption = layerSwitcher.getByText('OpenStreetMap', { exact: true });
  
  // If not found, maybe it's a button or link
  const openStreetMapButton = layerSwitcher.getByRole('button', { name: 'OpenStreetMap', exact: true });
  
  // Fallback: Look for any element with OpenStreetMap text
  const osmElement = layerSwitcher.getByText('OpenStreetMap');
  
  // Click the most specific locator found
  if (await openStreetMapButton.isVisible().catch(() => false)) {
    await openStreetMapButton.click();
  } else if (await openStreetMapOption.isVisible().catch(() => false)) {
    await openStreetMapOption.click();
  } else {
    // If still not found, maybe we need to click the layer switcher toggle to refresh or it's structured differently.
    // Let's try clicking the layer switcher toggle to see if it helps, or look for a base map selector button.
    // Since the layer switcher is open, let's look for a "Base Map" header or similar.
    // If no specific UI element is found, we might need to rely on the map model directly if the UI interaction is complex.
    // However, the use case requires UI interaction.
    // Let's assume there is a base map selector button or list item.
    // Let's try to click the layer switcher toggle to close and reopen if necessary, but it's already open.
    
    // Let's try to find a button with "OpenStreetMap" anywhere on the page if not in layer switcher
    const globalOsmButton = page.getByRole('button', { name: 'OpenStreetMap', exact: true });
    if (await globalOsmButton.isVisible().catch(() => false)) {
      await globalOsmButton.click();
    } else {
      // Last resort: Try to find any element with OpenStreetMap text
      const globalOsmText = page.getByText('OpenStreetMap', { exact: true });
      if (await globalOsmText.isVisible().catch(() => false)) {
        await globalOsmText.click();
      } else {
        // If we can't find it, we might need to look for a base map selector component.
        // Let's assume the layer switcher has a base map section.
        // We'll try to click the layer switcher panel to see if it reveals more options.
        await layerSwitcher.click();
        // After clicking, try again to find OpenStreetMap
        const retryOsmButton = page.getByRole('button', { name: 'OpenStreetMap', exact: true });
        if (await retryOsmButton.isVisible().catch(() => false)) {
          await retryOsmButton.click();
        } else {
          const retryOsmText = page.getByText('OpenStreetMap', { exact: true });
          if (await retryOsmText.isVisible().catch(() => false)) {
            await retryOsmText.click();
          }
        }
      }
    }
  }

  // Step 2: Assert that OpenStreetMap is now the active base layer
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
  
  // Assert that Carto Light is no longer selected
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.not.toBe('Carto Light');
});
