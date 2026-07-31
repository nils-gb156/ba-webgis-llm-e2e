// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the initial base layer to be Carto Light
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

    // Step 1 & 2: Open the base map selector and select 'OpenStreetMap'
    await page.getByRole('combobox', { name: 'Basemaps' }).selectOption('OpenStreetMap');

    // Expected results: The OpenStreetMap base map is selected
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
