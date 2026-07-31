// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial state to settle
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: Open the base map selector in the layer switcher.
    // The layer switcher is visible by default. We need to find the base map selector.
    // Based on typical UI patterns and the provided UI map, the layer switcher panel contains the base map options.
    // We look for a button or section that allows switching base maps.
    // Since no specific test id for the base map selector button is provided, we look inside the layer-switcher panel.
    // Often there's a "Base Map" or similar toggle/section. Let's assume the layer switcher itself allows interaction or has a specific control.
    // Looking at the UI map, `layer-switcher` is a panel. `layer-switcher-toggle` is a button to toggle the panel visibility.
    // The panel is visible by default. Inside, there might be radio buttons or buttons for base maps.
    // Let's look for an element that represents the base map selection area.
    // If not explicitly test-identified, we might need to use getByRole or getByText within the layer-switcher.
    // However, the prompt says "The user opens the base map selector". This implies a click action.
    // Let's assume there is a control to expand/collapse base maps or simply click the base map name if it's a list.
    // Given the complexity of auto-generated UI maps, let's look for a common pattern: a "Base Map" heading or a list of base maps.
    // If we can't find a specific test id, we'll try to find the "OpenStreetMap" option directly if it's visible, or a "Base Map" toggle.
    // Let's try to find the base map selector by looking for a button or link with text "Base Map" or similar.
    // Alternatively, the layer switcher might have a specific test id for the base map section.
    // Since we don't have it, we'll assume the user clicks on the layer switcher if it's collapsed (it's not) or interacts with the base map list.
    // Let's assume there is a button or clickable area for base maps.
    // A common pattern is a "Base Map" button that opens a list.
    // Let's try to find the "OpenStreetMap" option. If it's not visible, we might need to expand a section.
    // Let's look for a button or link with text "OpenStreetMap".
    
    // Wait for the layer switcher to be fully loaded and interactive
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Open the base map selector.
    // We need to find the control that opens the base map selection.
    // Let's look for a button or link that says "Base Map" or similar.
    // If not found, we might need to click on the layer switcher toggle if it was closed, but it's open.
    // Let's assume there is a "Base Map" section or button.
    // We'll try to find a button with text "Base Map" or similar within the layer switcher.
    // If that fails, we'll try to find the "OpenStreetMap" option directly.
    
    // Let's try to find the base map selector button.
    // Since we don't have a specific test id, we'll use getByText within the layer-switcher.
    // We look for a button or link with text "Base Map" or "Base Maps".
    const baseMapSelector = page.getByTestId('layer-switcher').getByRole('button', { name: 'Base Map', exact: true }).first();
    
    // If the base map selector button is not found, it might be that the base maps are directly visible or have a different structure.
    // Let's try to find any button within the layer switcher that might be the base map selector.
    // Alternatively, we can look for the "OpenStreetMap" option directly if it's visible.
    
    // Let's assume the base map selector is a button with text "Base Map".
    // If it's not there, we'll try to find the "OpenStreetMap" option.
    
    // Let's try to click the base map selector if it exists.
    // If it doesn't exist, we'll try to find the "OpenStreetMap" option directly.
    
    // Let's try to find the "OpenStreetMap" option.
    // It might be a radio button or a button.
    const osmOption = page.getByTestId('layer-switcher').getByRole('button', { name: 'OpenStreetMap', exact: true }).first();
    const osmRadio = page.getByTestId('layer-switcher').getByRole('radio', { name: 'OpenStreetMap', exact: true }).first();
    
    // Check if the option is already visible.
    // If not, we might need to open the base map selector.
    // Let's try to find the base map selector button.
    // If we can't find it, we'll assume the base maps are directly visible in the layer switcher.
    
    // Let's try to click the "OpenStreetMap" option if it's a button.
    // If it's a radio button, we click that.
    
    // First, let's try to find the base map selector button.
    // If we can't find it, we'll assume the base maps are directly visible.
    
    // Let's try to find the "Base Map" section or button.
    // We'll look for a heading or button with text "Base Map".
    const baseMapSection = page.getByTestId('layer-switcher').getByRole('heading', { name: 'Base Map', exact: true }).first();
    const baseMapButton = page.getByTestId('layer-switcher').getByRole('button', { name: 'Base Map', exact: true }).first();
    
    // If the base map selector is not found, we'll try to find the "OpenStreetMap" option directly.
    // Let's try to click the "OpenStreetMap" option if it's a button.
    if (await osmOption.isVisible()) {
        await osmOption.click();
    } else if (await osmRadio.isVisible()) {
        await osmRadio.click();
    } else {
        // If the option is not visible, we might need to open the base map selector.
        // Let's try to click the base map selector button.
        if (await baseMapButton.isVisible()) {
            await baseMapButton.click();
            // Wait for the options to appear and then click OpenStreetMap
            await expect(osmOption).toBeVisible();
            await osmOption.click();
        } else if (await baseMapSection.isVisible()) {
            // If it's a section, we might need to click it to expand.
            await baseMapSection.click();
            // Wait for the options to appear and then click OpenStreetMap
            await expect(osmOption).toBeVisible();
            await osmOption.click();
        } else {
            // Fallback: try to find any button with "OpenStreetMap" in the layer switcher
            const anyOsmButton = page.getByTestId('layer-switcher').getByRole('button', { name: /OpenStreetMap/i }).first();
            if (await anyOsmButton.isVisible()) {
                await anyOsmButton.click();
            } else {
                // Last resort: try to find any radio button with "OpenStreetMap"
                const anyOsmRadio = page.getByTestId('layer-switcher').getByRole('radio', { name: /OpenStreetMap/i }).first();
                if (await anyOsmRadio.isVisible()) {
                    await anyOsmRadio.click();
                } else {
                    throw new Error('Could not find OpenStreetMap option in layer switcher');
                }
            }
        }
    }

    // Step 2: Verify that OpenStreetMap is selected.
    // The expected result is that OpenStreetMap is selected and Carto Light is no longer selected.
    // We use the map model helper to check the active base layer title.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    
    // Also verify that Carto Light is no longer the active base layer.
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
    
    // Verify that the OpenStreetMap layer is rendered.
    await expect.poll(() => isLayerRendered(page, 'OpenStreetMap')).toBe(true);
    
    // Verify that Carto Light is no longer rendered (optional, but good practice).
    // Note: isLayerRendered checks if the layer is visible. If it's no longer active, it might still be in the layer collection but not visible.
    // However, for base layers, only one is active. So if OpenStreetMap is active, Carto Light should not be rendered.
    await expect.poll(() => isLayerRendered(page, 'Carto Light')).toBe(false);
});
