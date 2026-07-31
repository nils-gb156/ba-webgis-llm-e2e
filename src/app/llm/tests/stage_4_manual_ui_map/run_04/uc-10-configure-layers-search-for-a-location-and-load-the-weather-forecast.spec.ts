// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide Temperature layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show Precipitation layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify layer visibility state
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // 4. Wait for results and select the first one
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for map navigation
    const originalCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const newCenter = await getMapCenter(page);
        return newCenter && (newCenter[0] !== originalCenter?.[0] || newCenter[1] !== originalCenter?.[1]);
    }).toBe(true);

    // 6. Wait for weather forecast to load in info panel
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect.poll(() => forecastEntries.count()).toBeGreaterThanOrEqual(24);
});
