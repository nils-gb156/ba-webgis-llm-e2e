// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Layer switcher is visible
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Precondition: Temperature is initially visible
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Precondition: Precipitation is initially hidden
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    // Step 1: Hide Temperature overlay
    // The UI map indicates operational layers are a checkbox-list.
    // We need to find the checkbox for "Temperature" and click it.
    // Since we need to be specific, we scope to the layer switcher.
    const temperatureCheckbox = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureCheckbox).toBeChecked();
    await temperatureCheckbox.click({ force: true });

    // Step 2: Show Precipitation overlay
    const precipitationCheckbox = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });

    // Expected result: Precipitation is rendered
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Expected result: Temperature is NOT rendered (hidden)
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 3: Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    // The geocoder results appear after typing. We wait for the first result item.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for map navigation
    // We use the map model helpers to verify the map center has changed from the default.
    // We capture the initial center (implicitly, we just wait for a change or a reasonable zoom).
    // Since we don't know the exact target coordinates, we wait for the zoom level to settle
    // at a reasonable value for a city view (e.g., > 10) and the center to be defined.
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(10);
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    // Step 6: Wait for weather forecast to load in the info panel
    // The info panel contains a weather-forecast section which becomes visible and populated.
    // We wait for the weather-forecast element to be visible.
    const weatherForecastContainer = page.getByTestId('weather-forecast');
    await expect(weatherForecastContainer).toBeVisible();

    // Expected result: Info panel displays a weather forecast section with 24 entries.
    // We count the forecast entries.
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
