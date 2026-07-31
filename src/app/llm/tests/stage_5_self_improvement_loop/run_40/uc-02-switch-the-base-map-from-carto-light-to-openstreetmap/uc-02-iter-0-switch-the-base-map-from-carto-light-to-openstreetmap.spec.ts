// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Layer switcher is visible, Carto Light is active
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: The user opens the base map selector in the layer switcher.
    // The base map selector is a combobox with the accessible name "Basemaps".
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
    await basemapSelector.click();

    // Step 2: The user selects 'OpenStreetMap' as the base map.
    // After opening the combobox, a list of options should appear.
    // We use getByRole('option') with exact text to select "OpenStreetMap".
    await page.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();

    // Expected results: The OpenStreetMap base map is selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
