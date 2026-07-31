// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: Carto Light is active
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the layer switcher if it's not already visible (it is visible by default, but safe to ensure)
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherVisible = await layerSwitcher.isVisible();

  if (!layerSwitcherVisible) {
    await layerSwitcherToggle.click();
  }

  // Wait for the layer switcher to be visible
  await expect(layerSwitcher).toBeVisible();

  // The base map selector is a dropdown within the layer switcher
  // We need to find the dropdown control. Based on the UI map, "basemaps" is a dropdown.
  // We'll look for a combobox or dropdown within the layer switcher.
  // Since specific test ids for the dropdown options aren't provided, we use getByRole with exact name.
  // The dropdown might be rendered as a Chakra Select or similar.
  // Let's try to find the base map selector. It's likely a select element or a custom dropdown.
  // Given the structure, we can try to click on the current selection to open it, or find the dropdown input.
  // Let's assume the dropdown has a label or accessible name related to "Base map" or similar.
  // However, the UI map doesn't specify the accessible name for the base map dropdown.
  // Let's look for a select element or a button that opens the base map list.
  // Often, the current selection is displayed. Let's try to find the element showing "Carto Light".
  // If it's a select, we can use getByRole('combobox', { name: ... }) or similar.
  // Since we don't have the exact accessible name, we might need to rely on the text "Carto Light" being visible.
  // But getByText is ambiguous. Let's try to find the dropdown container.
  // The UI map says "basemaps" is a dropdown. Let's assume there's a test id or we can scope it.
  // If no test id, we might need to use a scoped query.
  // Let's try to find the dropdown by its role and visible text if possible.
  // Alternatively, we can look for a button or input inside the layer switcher that triggers the base map selection.
  // Let's try to find the element with text "Carto Light" and click it if it's a button or select option.
  // But strictly, we should use getByRole.
  // Let's assume the dropdown is a Chakra Select. It usually has a trigger button.
  // We can try to find the trigger button by its text "Carto Light".
  // To avoid ambiguity, we scope it to the layer switcher.
  const baseMapTrigger = layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true });
  
  // If the trigger is not found, it might be a select input.
  // Let's try a fallback to getByText scoped to the layer switcher if the button is not found.
  // However, the instructions say prefer getByRole. Let's try the button first.
  // If it fails, we might need to adjust. But let's assume it's a button trigger.
  
  // Actually, Chakra Select's trigger is a button. So this should work.
  await baseMapTrigger.click();

  // Now the dropdown options should be visible.
  // We need to select "OpenStreetMap".
  // The options are likely list items or buttons within the dropdown menu.
  // Let's find the option "OpenStreetMap" within the layer switcher.
  // It might be a list item or a button.
  // Let's try to find it by text, scoped to the layer switcher, and assuming it's a list item or button.
  const osmOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap', exact: true });
  
  // If it's not an option (e.g., if it's a custom list), we might need to use getByText.
  // But let's try role=option first.
  if (await osmOption.isVisible()) {
    await osmOption.click();
  } else {
    // Fallback: try to find it as a button or list item
    const osmButton = layerSwitcher.getByRole('button', { name: 'OpenStreetMap', exact: true });
    if (await osmButton.isVisible()) {
      await osmButton.click();
    } else {
      // Last resort: getByText, but this is ambiguous.
      // We'll try to find the text "OpenStreetMap" within the layer switcher.
      const osmText = layerSwitcher.getByText('OpenStreetMap', { exact: true });
      await osmText.click();
    }
  }

  // Wait for the base map to change
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
