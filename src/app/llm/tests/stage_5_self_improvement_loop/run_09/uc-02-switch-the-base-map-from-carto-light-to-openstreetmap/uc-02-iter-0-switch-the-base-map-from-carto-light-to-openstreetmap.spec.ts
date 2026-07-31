// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the initial base layer to be Carto Light
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: The user opens the base map selector in the layer switcher.
    // The accessibility tree shows a combobox "Basemaps" with current value "Carto Light".
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
    await basemapSelector.click();

    // Wait for the dropdown options to appear.
    await expect(page.getByRole('option', { name: 'OpenStreetMap' })).toBeVisible();

    // Step 2: The user selects 'OpenStreetMap' as the base map.
    await page.getByRole('option', { name: 'OpenStreetMap' }).click();

    // Expected results: The OpenStreetMap base map is selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

    // The Carto Light base map is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
