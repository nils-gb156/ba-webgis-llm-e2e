// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide Temperature overlay
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureCheckbox).toBeChecked();
    await temperatureCheckbox.click({ force: true });

    // Step 2: Show Precipitation overlay
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });

    // Verify layer visibility changes via map model
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    const firstResultItem = page.getByTestId('geocoder-result-item-0');
    await expect(firstResultItem).toBeVisible();
    await firstResultItem.click();

    // Step 5: Wait for map navigation (highlighted coordinate appears)
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Step 6: Wait for weather forecast to load (24 entries)
    const weatherForecastSection = page.getByTestId('weather-forecast');
    await expect(weatherForecastSection).toBeVisible();
    
    // The forecast entries are dynamic. We expect at least 24 entries to be present.
    // We poll to wait for the async forecast loading to complete.
    await expect.poll(async () => {
        const entries = page.getByTestId('weather-forecast-entry');
        return await entries.count();
    }).toBeGreaterThanOrEqual(24);
});
