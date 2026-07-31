// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify initial state: Carto Light should be active by default
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: Open the base map selector in the layer switcher.
    // The layer switcher is visible by default. We need to find the dropdown for basemaps.
    // Based on the UI map, the layer switcher contains the basemaps control.
    // We'll look for the dropdown within the layer-switcher.
    const layerSwitcher = page.getByTestId('layer-switcher');
    
    // Find the dropdown for basemaps. It likely has a label or test id.
    // Since no specific test id is given for the dropdown itself in the UI map,
    // we look for a role 'combobox' or 'listbox' or similar within the layer switcher.
    // However, Chakra UI dropdowns might not have a direct test id.
    // Let's assume there's a label "Basemaps" or similar. If not, we might need to click the layer switcher toggle if it was hidden, but it's visible.
    // The UI map says basemaps is a dropdown with options ["Carto Light", "Carto Dark", "OpenStreetMap"].
    // Let's try to find the dropdown by its label if available, or just click the layer switcher if it opens a panel.
    // The UI map says layer-switcher is visible. It likely contains the dropdown.
    // Let's look for a button or label that opens the basemap selection.
    // Often, the layer switcher itself is a panel that contains these controls.
    // Let's assume the dropdown is directly inside the layer-switcher.
    // We will try to find a combobox or select element.
    
    // Since the UI map doesn't specify a test id for the basemap dropdown, we'll use a fallback.
    // We'll look for a button or input that allows selecting basemaps.
    // Let's try clicking the layer switcher if it's a toggle, but the UI map says it's visible by default.
    // Let's assume the dropdown is accessible.
    
    // Let's try to find the dropdown by its placeholder or label.
    // If no specific locator is available, we might need to inspect the DOM or use a generic approach.
    // However, the instructions say to prefer getByTestId. If not available, use getByRole/Label/Text.
    // Let's assume there is a label "Basemaps" or similar.
    
    // Alternative: The layer switcher might be a panel that needs to be opened if it's toggled.
    // But the UI map says "layer-switcher" is visibleByDefault: true.
    // So the controls inside should be visible.
    
    // Let's try to find the dropdown.
    const basemapDropdown = layerSwitcher.getByRole('combobox', { name: /basemap/i }).first();
    if (basemapDropdown.count() === 0) {
        // Fallback: try to find a select element
        const basemapSelect = layerSwitcher.getByRole('listbox', { name: /basemap/i }).first();
        if (basemapSelect.count() > 0) {
            // If it's a listbox, we might need to click a trigger first.
            // Let's assume there's a button to open it.
            // This is getting speculative. Let's try a more generic approach.
            // Let's look for any button or input that might be the basemap selector.
            // We'll try to find an element with text "Carto Light" as it's the default.
            const defaultBasemapLabel = layerSwitcher.getByText('Carto Light').first();
            if (defaultBasemapLabel.count() > 0) {
                // Clicking the label might open the dropdown or select it.
                // Let's assume it opens the dropdown.
                await defaultBasemapLabel.click();
            }
        }
    } else {
        await basemapDropdown.click();
    }

    // Step 2: Select 'OpenStreetMap' as the base map.
    // Now that the dropdown is open, we select the option.
    await page.getByRole('option', { name: 'OpenStreetMap' }).click();

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
