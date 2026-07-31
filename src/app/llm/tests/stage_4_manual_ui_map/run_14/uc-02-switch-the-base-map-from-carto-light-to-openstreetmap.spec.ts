// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user opens the base map selector in the layer switcher.
    // The layer switcher is visible by default, so we just need to find the dropdown.
    // Based on the UI map, the layer switcher contains the basemaps control.
    // We look for the dropdown within the layer-switcher container.
    const layerSwitcher = page.getByTestId('layer-switcher');
    // The basemaps are a dropdown. We try to find it by role or test id if available.
    // Since the UI map doesn't give a specific test id for the dropdown itself,
    // we look inside the layer-switcher.
    // Often, these are select elements or custom dropdowns.
    // Let's assume there's a way to trigger it. If it's a standard select, we can use getByRole('combobox') or similar.
    // However, looking at the structure, "basemaps" is a controlType "dropdown".
    // Let's try to find the dropdown within the layer switcher.
    // If there's no specific test id, we might need to rely on the text or role.
    // Let's assume the dropdown has a label or accessible name.
    // If not, we might need to click the layer switcher toggle if it wasn't visible, but it is.
    
    // Let's try to find the basemap dropdown. It might be a select or a custom component.
    // If it's a Chakra UI select, it might be a button with an icon or text.
    // Let's try to find it by the text "Carto Light" which is the default selection.
    // Or by role 'combobox' or 'listbox'.
    
    // A safer bet for Chakra UI dropdowns is often a button that opens a menu.
    // Let's look for a button or combobox inside the layer switcher.
    // Since the UI map says "selection: single" and "options: [...]", it's likely a select-like control.
    
    // Let's try to find the dropdown by its likely accessible name or by finding the first dropdown in the layer switcher.
    // If the layer switcher is visible, we can look for a select element or a button that acts as a dropdown.
    // Let's assume there is a test id or we can find it by text.
    // If we can't find a specific test id, we might use getByRole('button', { name: /basemap/i }) or similar.
    // But the UI map doesn't specify the exact label.
    
    // Let's try to find the dropdown by clicking on the layer switcher if it's collapsible, but it's visible by default.
    // Let's assume the dropdown is directly inside the layer switcher.
    // We will try to find a select element or a button.
    
    // If the UI uses a Chakra UI Select, it renders a button and a list.
    // Let's try to find the button that opens the dropdown.
    // We'll look for a button inside the layer-switcher that might be the dropdown trigger.
    // Or we can look for the "Carto Light" text and click near it if it's a select.
    
    // Let's try a more generic approach: find the dropdown within the layer switcher.
    // If it's a Chakra UI Select, it might have a specific structure.
    // Let's try to find the dropdown by its placeholder or label if available.
    // Since we don't have a test id, we'll try to find it by role.
    
    // Let's assume the dropdown is a button with an icon or text indicating "Basemaps" or similar.
    // If not, we might need to look for the first dropdown in the layer switcher.
    
    // Let's try to find the dropdown by clicking on the layer switcher area if it's a toggle, but it's visible.
    // Let's try to find the dropdown by its accessible name.
    // If we can't find it, we might need to inspect the DOM.
    
    // For now, let's assume we can find the dropdown by its role or by the text "Carto Light".
    // Let's try to find the dropdown by the text "Carto Light" which is the current value.
    const basemapDropdown = layerSwitcher.getByRole('button', { name: /Carto Light/i }).first();
    
    // If the above doesn't work, we might need to look for a select element.
    // Let's try to find a select element inside the layer switcher.
    // const basemapDropdown = layerSwitcher.locator('select').first();
    
    // Let's proceed with the button approach as Chakra UI often renders selects as buttons.
    await basemapDropdown.click();

    // Step 2: The user selects 'OpenStreetMap' as the base map.
    // After clicking the dropdown, a list of options should appear.
    // We need to find the option "OpenStreetMap" and click it.
    // The options are likely in a listbox or menu.
    const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
    await osmOption.click();

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.
    
    // We use the helper function to verify the active base layer title.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
