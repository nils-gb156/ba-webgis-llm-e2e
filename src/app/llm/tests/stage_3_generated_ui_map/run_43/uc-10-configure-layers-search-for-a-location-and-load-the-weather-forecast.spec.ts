// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide Temperature overlay
    await page.getByRole('checkbox', { name: 'Temperature', exact: true }).click({ force: true });

    // Step 2: Show Precipitation overlay
    await page.getByRole('checkbox', { name: 'Precipitation', exact: true }).click({ force: true });

    // Verify layer visibility changes
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 3: Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    await page.waitForSelector('[data-testid^="geocoder-result-item-"]');
    await page.getByTestId('geocoder-result-item-0').click();

    // Step 5: Wait for map navigation
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center && (center[0] !== initialCenter?.[0] || center[1] !== initialCenter?.[1]);
    }).toBe(true);

    // Step 6: Wait for weather forecast to load in info panel
    const weatherSection = page.getByTestId('weather-forecast-section');
    await expect(weatherSection).toBeVisible();
    
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect.poll(() => forecastEntries.count()).toBeGreaterThanOrEqual(24);
});
