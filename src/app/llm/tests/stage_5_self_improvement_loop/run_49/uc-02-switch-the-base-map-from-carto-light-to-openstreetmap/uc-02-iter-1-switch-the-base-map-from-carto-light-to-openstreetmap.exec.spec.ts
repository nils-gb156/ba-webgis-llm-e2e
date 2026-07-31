// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the map is ready and the initial base layer is Carto Light
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: Open the base map selector in the layer switcher
    // The layer switcher toggle is already pressed, so the panel is visible.
    // The basemap selector is a combobox.
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
    await basemapSelector.click();

    // Step 2: Select 'OpenStreetMap' as the base map
    // The options in the combobox are typically exposed as options or list items.
    // Using getByRole('option') is the standard way to select from a combobox.
    const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
    await openStreetMapOption.click();

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
