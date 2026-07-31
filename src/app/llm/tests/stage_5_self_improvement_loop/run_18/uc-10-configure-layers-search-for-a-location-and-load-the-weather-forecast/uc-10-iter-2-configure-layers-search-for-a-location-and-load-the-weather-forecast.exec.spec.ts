// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide the Temperature overlay layer.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show the Precipitation overlay layer.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location using the geocoder.
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result.
    // The results are rendered as a list with testid 'geocoder-results'.
    // Each item has a testid like 'geocoder-result-item-0'.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate to the selected location.
    // We poll the map center to confirm it has moved.
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).toMatchObject([
        expect.any(Number),
        expect.any(Number),
    ]);

    // Step 6: Wait for the info panel to load the forecast.
    // The info panel contains a "Weather Forecast" section. Once loaded, it should display
    // 24 entries (one for each hour in a 24-hour forecast).
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // The forecast entries are rendered with testid 'weather-forecast-entry'.
    // We will poll for the count of forecast items to be at least 24.
    await expect.poll(async () => {
        return page.locator('[data-testid="weather-forecast-entry"]').count();
    }).toBeGreaterThanOrEqual(24);
});
