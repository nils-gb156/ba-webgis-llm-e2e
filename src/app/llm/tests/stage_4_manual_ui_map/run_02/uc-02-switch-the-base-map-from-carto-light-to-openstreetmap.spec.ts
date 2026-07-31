// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user opens the base map selector in the layer switcher.
    // The layer switcher is visible by default, so we just need to find the dropdown.
    // Based on the UI map, the base maps are in a dropdown control within the layer switcher.
    // We assume the dropdown trigger is accessible or has a test id.
    // Since no specific test id is given for the dropdown trigger itself, we look for the layer switcher
    // and then find the dropdown. However, the UI map says "controlType": "dropdown" for basemaps.
    // Usually, this renders as a select or a custom dropdown. Let's try to find the options directly or the selector.
    // Given the strict locator rules, let's look for the "Carto Light" text which is the default.
    // It's likely inside the layer switcher.
    
    // Let's assume the layer switcher contains the base map selection.
    // We will click on the layer switcher toggle if it's not already open, but it is visible by default.
    // The UI map says "layer-switcher" is visible by default.
    // We need to find the dropdown for base maps.
    
    // Let's try to find the "Carto Light" option or the dropdown that contains it.
    // Since it's a dropdown, we might need to click a trigger first.
    // Let's look for the layer switcher container.
    const layerSwitcher = page.getByTestId('layer-switcher');
    
    // Try to find the base map dropdown. It might be a select or a button.
    // If it's a custom Chakra dropdown, it might be a button.
    // Let's try to find the text "Carto Light" which is the current selection.
    // Or we can look for the dropdown trigger.
    // Without a specific test id for the dropdown trigger, we might have to guess the role.
    // Let's assume there is a button or list item for "Carto Light".
    
    // Let's try to find the "OpenStreetMap" option first to see if it's visible.
    // If it's in a dropdown, it might not be visible until opened.
    
    // Let's try clicking on the layer switcher area to see if it expands or if the dropdown is already there.
    // The UI map says "layer-switcher" is visible by default.
    
    // Let's try to find the dropdown trigger. It might be labeled "Base map" or similar.
    // If we can't find it, we might need to look for the "Carto Light" text.
    
    // Let's try to find the "Carto Light" text within the layer switcher.
    const cartoLightText = layerSwitcher.getByText('Carto Light');
    // If this exists, it might be the current selection or an option.
    
    // Let's try to find the dropdown trigger. It might be a button with aria-expanded or similar.
    // Let's try to find any button inside the layer switcher that might be the trigger.
    // Or, let's try to find the "OpenStreetMap" text.
    
    // Alternative: The base map selector might be a select element.
    // Let's try to find a select element inside the layer switcher.
    const baseMapSelect = layerSwitcher.locator('select');
    if (await baseMapSelect.count() > 0) {
        // It's a native select
        await baseMapSelect.selectOption('OpenStreetMap');
    } else {
        // It's likely a custom dropdown.
        // Let's try to find the trigger. It might be the first button or have a specific label.
        // Let's try to find the "Carto Light" text and click it if it's a button.
        // Or find a button that says "Base map" or similar.
        
        // Let's try to find the dropdown trigger by looking for a button that might toggle the list.
        // Since we don't have a test id, we'll try to find the "Carto Light" text and assume it's the current selection button.
        const currentSelection = layerSwitcher.getByText('Carto Light', { exact: true });
        if (await currentSelection.count() > 0) {
            await currentSelection.click();
        } else {
            // Fallback: try to find any button in the layer switcher that might be the trigger.
            // This is risky. Let's try to find the "OpenStreetMap" text directly if it's visible.
            const osmOption = layerSwitcher.getByText('OpenStreetMap');
            if (await osmOption.isVisible()) {
                await osmOption.click();
            } else {
                // If not visible, we need to open the dropdown.
                // Let's try to find a button with "Base map" or similar label.
                // Or try to find the first button in the layer switcher.
                const trigger = layerSwitcher.locator('button').first();
                await trigger.click();
            }
        }
        
        // Now select OpenStreetMap
        const osmOption = layerSwitcher.getByText('OpenStreetMap', { exact: true });
        await expect(osmOption).toBeVisible();
        await osmOption.click();
    }

    // Step 2: The user selects 'OpenStreetMap' as the base map.
    // This was done in the previous step if it was a native select.
    // If it was a custom dropdown, we clicked the option.

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.

    // Assert using the map model helper
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
