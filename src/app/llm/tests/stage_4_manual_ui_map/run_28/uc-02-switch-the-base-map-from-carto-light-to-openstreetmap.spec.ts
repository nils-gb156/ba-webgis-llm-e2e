// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is visible by default, so we look for the dropdown within it.
  const layerSwitcher = page.getByTestId('layer-switcher');
  // The base map selector is typically a dropdown or select inside the layer switcher.
  // We look for a dropdown control. If it's a custom Chakra dropdown, we might need to click the trigger.
  // Based on the UI map, it's a "dropdown" control type. We'll try to find a select or a button that opens it.
  // Assuming standard Chakra Select or similar, we can often just click the select element or its label.
  // Let's look for a select element or a button labeled with the current base map or "Base Map".
  // Since the UI map says "controlType": "dropdown", we'll try to find a role=combobox or similar.
  // If not found, we might need to click a specific toggle.
  // Let's assume there's a visible dropdown trigger or a select element.
  // We will try to interact with the layer switcher's base map selector.
  // Often, this is a `select` element or a `button` that opens a menu.
  // Let's try to find a button or input that allows changing the base map.
  // If the UI map implies a dropdown, we might need to click the dropdown trigger.
  // Let's assume the dropdown is clickable via a specific test id or role.
  // If no specific test id is given for the dropdown trigger, we might use getByRole('combobox') or similar.
  // However, the UI map doesn't give a test id for the dropdown itself, only for the container.
  // We'll try to find a dropdown/combobox inside the layer switcher.
  const baseMapSelector = layerSwitcher.getByRole('combobox', { name: /base map/i }).first();
  if (baseMapSelector.isVisible()) {
    await baseMapSelector.click();
  } else {
    // Fallback: try to find a select element
    const baseMapSelect = layerSwitcher.locator('select').first();
    if (baseMapSelect.isVisible()) {
      await baseMapSelect.selectOption('OpenStreetMap');
      // If we selected directly, we can skip the next step
      // But the use case says "selects 'OpenStreetMap' as the base map", implying a click action.
      // Let's assume we need to open it first if it's not already open.
      // If the above selectOption worked, we are done with selection.
      // However, the use case steps are: 1. Open selector, 2. Select option.
      // If we used selectOption, we did both. Let's stick to the click approach if possible.
      // If the combobox wasn't found, maybe it's a button that opens a list.
      // Let's try to find a button that says "Base Map" or similar.
      const baseMapButton = layerSwitcher.getByRole('button', { name: /base map/i }).first();
      if (baseMapButton.isVisible()) {
        await baseMapButton.click();
      } else {
        // Last resort: try to find any dropdown trigger
        const dropdownTrigger = layerSwitcher.locator('[role="button"]').filter({ hasText: /base/i }).first();
        if (dropdownTrigger.isVisible()) {
          await dropdownTrigger.click();
        }
      }
    }
  }

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // After opening the dropdown, we need to click 'OpenStreetMap'.
  // The options are listed in the UI map.
  // We'll look for a list item or option with the text 'OpenStreetMap'.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' }).first();
  if (openStreetMapOption.isVisible()) {
    await openStreetMapOption.click();
  } else {
    // Fallback: if it's a select, we might have already selected it.
    // Or if it's a list, we click the item.
    const osmItem = page.getByText('OpenStreetMap').first();
    if (osmItem.isVisible()) {
      await osmItem.click();
    }
  }

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We use the map model helper to verify the active base layer title.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
