// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user opens the base map selector in the layer switcher.
    // The layer switcher is visible by default, so we can directly interact with it.
    // We look for the dropdown control within the layer-switcher panel.
    const layerSwitcher = page.getByTestId('layer-switcher');
    // The base map selector is likely a dropdown/select inside the layer switcher.
    // We try to find a select element or a button that opens the base map list.
    // Based on the UI map, it's a dropdown with options ["Carto Light", "Carto Dark", "OpenStreetMap"].
    // We will look for a select element or a combobox.
    const baseMapSelector = layerSwitcher.locator('select, button[role="combobox"], input[role="combobox"]').first();
    
    // If it's a custom Chakra dropdown, it might be a button. Let's try clicking it.
    // If the locator finds nothing, we might need to look for a button with a specific label or role.
    // Given the structure, it's often a Chakra Select which renders as a button.
    if (await baseMapSelector.count() === 0) {
        // Fallback: look for a button that might represent the base map selector
        // Often labeled with the current selection or an icon.
        // Let's try to find any button inside the layer switcher that isn't a toggle for panels.
        const potentialButtons = layerSwitcher.locator('button').filter({ hasNot: page.getByTestId(/-toggle$/) });
        if (await potentialButtons.count() > 0) {
            await potentialButtons.first().click();
        }
    } else {
        // It's a native select or combobox
        await baseMapSelector.click();
    }

    // Step 2: The user selects 'OpenStreetMap' as the base map.
    // After opening the selector, we need to select the option.
    // If it was a native select, we can select the option directly.
    // If it was a custom dropdown, we might need to click the option.
    
    // Let's try to find the option "OpenStreetMap" within the layer switcher.
    const osmOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap' });
    if (await osmOption.count() > 0) {
        await osmOption.click();
    } else {
        // Fallback: try to find it as a list item or button
        const osmButton = layerSwitcher.getByRole('button', { name: 'OpenStreetMap' });
        if (await osmButton.count() > 0) {
            await osmButton.click();
        } else {
            // Last resort: try to find text
            const osmText = layerSwitcher.getByText('OpenStreetMap', { exact: true });
            if (await osmText.count() > 0) {
                await osmText.click();
            }
        }
    }

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
