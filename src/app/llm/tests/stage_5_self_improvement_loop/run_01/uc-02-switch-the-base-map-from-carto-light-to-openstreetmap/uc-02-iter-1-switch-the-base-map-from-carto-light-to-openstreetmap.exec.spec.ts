// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Carto Light is active by default
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: Open the base map selector (the combobox trigger is a button)
    const basemapSelect = page.getByRole('combobox', { name: 'Basemaps' });
    await basemapSelect.click();

    // Step 2: Select 'OpenStreetMap' from the listbox
    await page.getByRole('option', { name: 'OpenStreetMap' }).click();

    // Expected results: OpenStreetMap is selected, Carto Light is no longer selected
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
