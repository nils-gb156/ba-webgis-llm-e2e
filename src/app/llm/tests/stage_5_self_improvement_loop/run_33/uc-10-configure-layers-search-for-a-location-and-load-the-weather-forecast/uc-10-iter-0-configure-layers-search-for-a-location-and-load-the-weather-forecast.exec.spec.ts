// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer.
    const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click({ force: true });

    // 2. Show the Precipitation overlay layer.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click({ force: true });

    // 3. Wait for layer state to settle.
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 4. Search for a location using the geocoder.
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // 5. Wait for the result list to appear and select the first result.
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel).toBeVisible();
    const firstResult = geocoderPanel.getByRole('option').first();
    await firstResult.click();

    // 6. Wait for the map to navigate to the selected location.
    const mapCenter = page.getByTestId('map-container');
    const initialCenter = await page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: { olMap: { getView: () => { getCenter: () => number[] } } } }).__openPioneerMap;
        return map?.olMap.getView().getCenter();
    });

    // Wait for the map center to change (indicating navigation to the search result).
    await expect.poll(async () => {
        const map = (globalThis as { __openPioneerMap?: { olMap: { getView: () => { getCenter: () => number[] } } } }).__openPioneerMap;
        return map?.olMap.getView().getCenter();
    }).not.toEqual(initialCenter);

    // 7. Wait for the info panel to load the forecast.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // 8. Assert that the info panel displays a weather forecast section with 24 entries.
    // The forecast entries are typically rendered as items within the weather-forecast-section.
    const forecastEntries = weatherForecastSection.getByRole('listitem');
    await expect(forecastEntries).toHaveCount(24);
});
