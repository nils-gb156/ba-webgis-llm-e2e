// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and Carto Light to be active by default
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Open the base map selector in the layer switcher.
    // The layer switcher is visible by default. We need to find the base map selector.
    // Based on typical UI patterns, the base map selector is often a specific section or button within the layer switcher.
    // Since no specific test id for "base map selector" is provided in the UI map, we look for a role or text.
    // The layer switcher panel is `layer-switcher`. Inside, we look for the base map options.
    // Often, base maps are toggled via buttons or a dropdown. Let's assume there's a way to expand/select base maps.
    // If there's no explicit "base map selector" button, the base maps might be listed directly.
    // However, the use case says "opens the base map selector", implying a toggle or expansion.
    // Let's look for a button or section related to base maps.
    // If not explicitly labeled, we might need to rely on the layer switcher's structure.
    // Let's try to find a button or element that allows switching base maps.
    // Common pattern: A button labeled "Base Map" or similar.
    // If not found, we might need to click on the layer switcher toggle if it was closed, but it's open.
    // Let's assume there is a specific control for base maps.
    // If the UI map doesn't list a specific "base map selector" test id, we might need to use getByText or getByRole.
    // Let's look for a button or link that says "Base Map" or similar.
    // If not, we might need to interact with the layer switcher's tree.
    // Let's try to find a button that opens the base map selection.
    // If no such button exists, maybe the base maps are just a list of radio buttons or checkboxes in the layer switcher.
    // Let's check the layer switcher content.
    // Since the UI map is auto-generated, it might not list every interactive element if it's a complex component.
    // Let's try to find a button with text "Base Map" or similar.
    const baseMapSelector = page.getByRole('button', { name: 'Base Map' }).first();
    if (await baseMapSelector.isVisible()) {
        await baseMapSelector.click();
    } else {
        // If no explicit button, maybe the base maps are listed in the layer switcher.
        // We will look for "OpenStreetMap" in the layer switcher and click it.
        // But first, let's ensure the layer switcher is fully loaded.
        await expect(page.getByTestId('layer-switcher')).toBeVisible();
    }

    // Select 'OpenStreetMap' as the base map.
    // We look for the text 'OpenStreetMap' in the layer switcher.
    // It might be a button, a list item, or a radio label.
    const osmLayer = page.getByTestId('layer-switcher').getByRole('button', { name: 'OpenStreetMap' }).first();
    if (await osmLayer.isVisible()) {
        await osmLayer.click();
    } else {
        // Fallback: try getByText if getByRole fails, but scope it to the layer switcher.
        const osmText = page.getByTestId('layer-switcher').getByText('OpenStreetMap', { exact: true }).first();
        if (await osmText.isVisible()) {
            await osmText.click();
        } else {
            // If still not found, try to find it by role 'radio' or 'checkbox' if applicable.
            const osmRadio = page.getByTestId('layer-switcher').getByRole('radio', { name: 'OpenStreetMap' }).first();
            if (await osmRadio.isVisible()) {
                await osmRadio.click({ force: true });
            } else {
                // Last resort: try to find it by label or text in a more generic way.
                // This part might need adjustment based on actual UI structure.
                // For now, we assume one of the above methods works.
                // If none work, the test will fail, which is acceptable if the UI map is incomplete.
                // Let's try clicking the first available option that matches 'OpenStreetMap' anywhere in the layer switcher.
                const osmOption = page.getByTestId('layer-switcher').locator('button, label, li').filter({ hasText: 'OpenStreetMap' }).first();
                if (await osmOption.isVisible()) {
                    await osmOption.click();
                }
            }
        }
    }

    // Assert that OpenStreetMap is now the active base layer.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

    // Assert that Carto Light is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
