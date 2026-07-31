// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user opens the base map selector in the layer switcher.
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  // Ensure the layer switcher is visible. The toggle might already be active.
  const isLayerSwitcherVisible = await page.getByTestId('layer-switcher').isVisible();
  if (!isLayerSwitcherVisible) {
    await layerSwitcherToggle.click();
  }

  // Locate the base map dropdown within the layer switcher.
  // The UI map indicates "basemaps" is a dropdown inside "layer-switcher".
  // We use getByRole('combobox') or similar, but since we need to scope it:
  const layerSwitcher = page.getByTestId('layer-switcher');
  // Assuming the dropdown has a test id or accessible name. If not, we might need to look for the control.
  // Based on typical Chakra UI dropdowns, we look for the trigger.
  // Let's assume the dropdown itself has a test id or we find it by role within the switcher.
  // Since the prompt doesn't give specific test ids for the dropdown options, we rely on the structure.
  // However, looking at the UI map, it just says "controlType": "dropdown".
  // Often these are implemented as Chakra Menu or Select.
  // Let's try to find the dropdown trigger. If it doesn't have a test id, we might use a label or role.
  // Let's assume there's a way to identify the dropdown.
  // If no test id is provided for the dropdown itself, we might need to infer.
  // But wait, the UI map doesn't give a test id for the dropdown input/trigger.
  // Let's look for a button or combobox inside the layer-switcher that controls basemaps.
  // Often, "Basemaps" might be a label or the dropdown itself.
  // Let's try to click on a plausible target. If the dropdown is a Chakra Select/Menu, it might be a button.
  // Let's assume we can find it by text or role.
  // Since I cannot see the actual DOM, I will use a generic approach for the dropdown trigger.
  // If the dropdown is not directly accessible by test id, I'll use getByRole('combobox') or button inside the switcher.
  // Let's assume the dropdown is identified by its context.
  
  // Alternative: The UI map says "basemaps" is a dropdown.
  // Let's try to find the element that represents the base map selection.
  // If there's no test id, I'll use getByRole('combobox', { name: /basemap/i }) or similar.
  // But "basemap" might not be the accessible name.
  // Let's look for a button that opens the basemap list.
  
  // Since I must use test ids if available, and none are explicitly given for the dropdown trigger,
  // I will use a fallback. However, in many such apps, the dropdown might be a Chakra MenuButton.
  // Let's try to find the dropdown by its position in the layer switcher.
  // If I can't find it, I might fail. But let's assume there's a standard way.
  // Let's try to find the dropdown trigger.
  
  // Let's assume the dropdown is accessible via a role.
  const basemapDropdown = layerSwitcher.getByRole('combobox', { name: /basemap/i, exact: false }).first();
  // If that fails, try button.
  const basemapButton = layerSwitcher.getByRole('button', { name: /basemap/i, exact: false }).first();
  
  // Since I don't know the exact accessible name, I'll try to find the dropdown by its typical Chakra structure if possible,
  // but the prompt says to prefer getByTestId or getByRole.
  // Let's assume there is a test id for the dropdown or its trigger that I missed? No, the UI map doesn't list it.
  // Let's try to find the dropdown by its label "Basemaps" if it exists.
  // Or maybe the dropdown is just a button that says "Carto Light" (the current selection).
  
  // Let's try clicking the layer switcher's content area to see if there's a dropdown.
  // Actually, let's look at the "basemaps" section again.
  // It's a dropdown.
  // Let's try to find a button or combobox in the layer switcher.
  
  // If I can't find it, I'll use a scoped locator.
  // Let's try to find the dropdown trigger.
  const dropdownTrigger = layerSwitcher.locator('button, [role="combobox"]').first();
  await dropdownTrigger.click();

  // 2. The user selects 'OpenStreetMap' as the base map.
  // Wait for the menu to open and click the option.
  await page.getByText('OpenStreetMap').click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
