// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Hide the Temperature overlay layer.
    // The layer switcher is visible by default. We target the checkbox for "Temperature".
    const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click();

    // Step 2: Show the Precipitation overlay layer.
    // The layer switcher is visible by default. We target the checkbox for "Precipitation".
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click();

    // Verify layer visibility changes
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location.
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate to the selected location.
    // The center should change from the initial default to the coordinates of Münster.
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center && (center[0] !== initialCenter?.[0] || center[1] !== initialCenter?.[1]);
    }).toBe(true);

    // Step 6: Wait for the info panel to load the forecast.
    // The forecast appears after clicking the map, which the geocoder selection implicitly does.
    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();

    // Verify the weather forecast has 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
