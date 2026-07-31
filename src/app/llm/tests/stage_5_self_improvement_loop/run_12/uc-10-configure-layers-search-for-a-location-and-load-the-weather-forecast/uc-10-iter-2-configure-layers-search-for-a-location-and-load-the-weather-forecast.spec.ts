// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureCheckbox).toBeChecked();
    await temperatureCheckbox.click({ force: true });

    // 2. Show the Precipitation overlay layer
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });

    // Verify layer state via helpers
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a location using the geocoder
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // 4. Select the first result
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await firstResult.click();

    // 5. Wait for the map to navigate to the selected location
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // 6. Wait for the info panel to load the forecast
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Verify the info panel displays a weather forecast section with 24 entries
    const forecastEntries = weatherForecastSection.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
