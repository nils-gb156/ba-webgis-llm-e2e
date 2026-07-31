// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the initial base layer to be set
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Open the layer switcher panel if it is not already visible
    const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
    const layerSwitcherPanel = page.getByRole('region', { name: 'Layer Switcher' });
    
    // Check if the panel is visible; if not, click the toggle
    const isPanelVisible = await layerSwitcherPanel.isVisible().catch(() => false);
    if (!isPanelVisible) {
        await layerSwitcherToggle.click();
    }

    // Wait for the layer switcher panel to be visible
    await expect(layerSwitcherPanel).toBeVisible();

    // Locate the 'OpenStreetMap' base map option within the layer switcher
    // Assuming the base maps are presented as radio buttons or similar selectable items
    const openStreetMapOption = page.getByRole('radio', { name: 'OpenStreetMap' })
        .or(page.getByRole('option', { name: 'OpenStreetMap' }))
        .or(page.getByLabel('OpenStreetMap'));

    // Click the OpenStreetMap option
    await openStreetMapOption.click();

    // Assert that the active base layer has changed to OpenStreetMap
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

    // Assert that Carto Light is no longer the active base layer
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
