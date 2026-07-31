// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide Temperature overlay
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
    await temperatureCheckbox.click();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // 2. Show Precipitation overlay
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationCheckbox.click();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a location
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // 4. Select first result
    const firstResult = page.getByRole('option', { name: /Münster/ }).first();
    await firstResult.click();

    // 5. Wait for map to navigate
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 6. Wait for forecast to load
    await expect.poll(async () => {
        const section = page.getByTestId('weather-forecast-section');
        const items = section.getByRole('listitem');
        const count = await items.count();
        return count;
    }).toBe(24);
});
