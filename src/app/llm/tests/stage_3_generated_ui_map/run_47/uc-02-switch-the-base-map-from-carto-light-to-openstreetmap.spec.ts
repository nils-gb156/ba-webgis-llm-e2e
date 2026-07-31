// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial base layer to be Carto Light
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Open the layer switcher panel if it's not already visible (though it is by default)
    const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
    const isLayerSwitcherVisible = page.locator('#layer-switcher-panel').isVisible();
    
    if (!(await isLayerSwitcherVisible)) {
        await layerSwitcherToggle.click({ force: true });
    }

    // Wait for the layer switcher panel to be visible
    await expect(page.locator('#layer-switcher-panel')).toBeVisible();

    // Select 'OpenStreetMap' as the base map.
    // Base maps are typically radio buttons or similar in a switcher.
    // We look for a radio button or option with the text "OpenStreetMap" inside the layer switcher.
    const osmBaseMapOption = page.locator('#layer-switcher-panel').getByRole('radio', { name: 'OpenStreetMap', exact: true });
    
    // If it's not a radio, it might be a button or a clickable list item.
    // Given the UI map, we'll try getByRole first. If not found, we might need to click a specific element.
    // Assuming standard Chakra UI RadioGroup behavior for base maps.
    if (await osmBaseMapOption.isVisible()) {
        await osmBaseMapOption.click({ force: true });
    } else {
        // Fallback: try clicking a button or link with the name
        const osmButton = page.locator('#layer-switcher-panel').getByRole('button', { name: 'OpenStreetMap', exact: true });
        if (await osmButton.isVisible()) {
            await osmButton.click();
        } else {
            // Last resort: text within the panel
            await page.locator('#layer-switcher-panel').getByText('OpenStreetMap', { exact: true }).click();
        }
    }

    // Verify that the active base layer is now OpenStreetMap
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

    // Verify that Carto Light is no longer selected
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
