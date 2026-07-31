// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer.
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation overlay layer.
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Assert layer visibility states via the map model helper.
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a location using the geocoder.
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // 4. Wait for the result list to appear and select the first result.
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel.getByRole('option', { name: 'Münster' })).toBeVisible();
    await geocoderPanel.getByRole('option', { name: 'Münster' }).click();

    // 5. Wait for the map to navigate to the selected location.
    // The map center should change from the initial extent to Münster's coordinates.
    const initialCenter = await getMapCenter(page);
    await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

    // 6. Wait for the info panel to load the forecast.
    // The info panel should display a weather forecast section with 24 entries.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Count the forecast entries (expected to be 24).
    const forecastEntries = weatherForecastSection.locator('[data-testid="forecast-entry"]');
    await expect(forecastEntries).toHaveCount(24);
});
