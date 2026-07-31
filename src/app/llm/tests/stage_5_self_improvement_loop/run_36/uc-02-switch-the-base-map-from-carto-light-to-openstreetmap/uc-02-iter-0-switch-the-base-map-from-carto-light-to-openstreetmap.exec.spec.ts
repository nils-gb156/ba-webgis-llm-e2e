// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Open the base map selector in the layer switcher.
    // The layer switcher is already visible, and the combobox for "Basemaps" is available.
    const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
    await basemapCombobox.click();

    // Step 2: Select 'OpenStreetMap' as the base map.
    const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
    await openStreetMapOption.click();

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
