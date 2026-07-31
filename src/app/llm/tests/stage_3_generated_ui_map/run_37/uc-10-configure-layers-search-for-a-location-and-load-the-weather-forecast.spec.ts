// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();

    // 1. Hide Temperature layer
    const temperatureToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click({ force: true });

    // 2. Show Precipitation layer
    const precipitationToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click({ force: true });

    // 3. Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // 4. Wait for results and select first
    await expect(page.getByTestId('geocoder-results')).toBeVisible();
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for map to navigate
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center && (center[0] !== initialCenter?.[0] || center[1] !== initialCenter?.[1]);
    }).toBeTruthy();

    // 6. Wait for info panel to load forecast with 24 entries
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    
    const weatherEntries = page.getByTestId('weather-forecast-entry');
    await expect.poll(async () => {
        return await weatherEntries.count();
    }).toBe(24);
});
