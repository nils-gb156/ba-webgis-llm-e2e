// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the initial base layer to be Carto Light
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // The layer switcher is already visible in the initial state.
    // The base map selector is a combobox with the accessible name "Basemaps".
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });

    // Open the combobox and select 'OpenStreetMap'
    await basemapSelector.click();
    await page.getByRole('option', { name: 'OpenStreetMap' }).click();

    // Verify that the active base layer is now OpenStreetMap
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
