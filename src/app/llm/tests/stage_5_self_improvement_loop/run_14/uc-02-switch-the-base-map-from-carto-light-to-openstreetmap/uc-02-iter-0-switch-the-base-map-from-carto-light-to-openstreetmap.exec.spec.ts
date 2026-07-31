// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify initial state: Carto Light is the active base map
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // The layer switcher is already visible and the basemaps combobox is visible.
    // Open the base map selector.
    await page.getByRole('combobox', { name: 'Basemaps' }).click();

    // Wait for the dropdown options to appear (the menu is a Chakra Popover)
    await page.getByRole('option', { name: 'OpenStreetMap' }).waitFor({ state: 'visible' });

    // Select OpenStreetMap
    await page.getByRole('option', { name: 'OpenStreetMap' }).click();

    // Verify that OpenStreetMap is now the active base map
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
