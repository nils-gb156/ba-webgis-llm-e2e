// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify initial state: Carto Light is active
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: Open the base map selector in the layer switcher
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');

    // Ensure layer switcher is visible
    await expect(layerSwitcher).toBeVisible();

    // Locate the base map dropdown within the layer switcher
    // The UI map indicates a dropdown with options ["Carto Light", "Carto Dark", "OpenStreetMap"]
    // We need to find the select/dropdown element inside the layer-switcher
    // Since no specific test-id is given for the dropdown itself, we look for a select or combobox
    // Often these are rendered as Chakra Select which might not have a direct test-id.
    // However, we can try to find the dropdown by its role or by finding the options.
    // Let's assume the layer switcher contains the base map selector.
    // We will look for a select element or a combobox within the layer switcher.
    // If not found, we might need to look for the text "Carto Light" to identify the current selection.
    
    // A common pattern in Chakra UI for select is to have a button that opens a menu.
    // Let's try to find the element that represents the base map selection.
    // Since the prompt doesn't give a test-id for the base map selector specifically,
    // we might need to rely on the visible text or role.
    // However, looking at the UI map, it says "controlType": "dropdown".
    // Let's try to find a select element or a combobox inside the layer-switcher.
    
    // If there's no specific test-id, we might need to use getByRole with a name.
    // But the name might be ambiguous. Let's look for the first select element in the layer switcher.
    // Or we can look for the text "Carto Light" and click it if it's a button.
    
    // Let's assume the base map selector is a Chakra Select.
    // We can try to find the select control by looking for the label or the current value.
    // Since "Carto Light" is the default, we can look for it.
    
    // Let's try to find the base map selector by looking for the text "Carto Light" inside the layer switcher.
    // If it's a button or a clickable element, we can click it.
    
    // Alternative: The layer switcher might have a specific section for base maps.
    // Let's look for a container or a group that contains the base map options.
    // Since the UI map is manually authored, we might need to infer the structure.
    // Let's assume the base map selector is a dropdown with a test-id or a role.
    // If not, we might need to use a more generic locator.
    
    // Let's try to find the base map selector by looking for a select element inside the layer switcher.
    const baseMapSelector = layerSwitcher.locator('select').first();
    
    // If it's not a select, it might be a Chakra Select which renders as a button.
    // Let's try to find a button with the text "Carto Light".
    const baseMapButton = layerSwitcher.getByRole('button', { name: 'Carto Light' });
    
    // We'll try the button first, as Chakra Select often renders as a button.
    if (await baseMapButton.isVisible().catch(() => false)) {
        await baseMapButton.click();
    } else if (await baseMapSelector.isVisible().catch(() => false)) {
        // If it's a native select, we might need to interact with it differently.
        // But Playwright can handle native selects with selectOption.
        // However, we need to click it first to open it if it's not native.
        // Let's assume it's a Chakra Select for now.
        await baseMapSelector.click();
    } else {
        // Fallback: Look for any clickable element with "Carto Light" text
        const cartoLightElement = layerSwitcher.getByText('Carto Light').first();
        await cartoElement.click();
    }

    // Step 2: Select 'OpenStreetMap' as the base map
    // After clicking the selector, a dropdown menu should appear.
    // We need to find the option "OpenStreetMap" and click it.
    
    // Look for the option in the dropdown menu.
    // Chakra Select renders options as list items in a menu.
    const osmOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap' });
    await expect(osmOption).toBeVisible();
    await osmOption.click();

    // Expected results: The OpenStreetMap base map is selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
