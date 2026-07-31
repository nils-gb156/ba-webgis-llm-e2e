// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Hide Temperature overlay
    // Temperature is initially visible, so we click its toggle to hide it.
    // The toggle is a Chakra checkbox/switch, so we use force: true.
    const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' }).first();
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click({ force: true });

    // Step 2: Show Precipitation overlay
    // Precipitation is initially hidden, so we click its toggle to show it.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' }).first();
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click({ force: true });

    // Step 3: Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for map navigation
    // The map should navigate to Münster. We assert that the center has changed from the initial state.
    // We use a poll to wait for the map center to settle at the new location.
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const newCenter = await getMapCenter(page);
        return newCenter && (newCenter[0] !== initialCenter?.[0] || newCenter[1] !== initialCenter?.[1]);
    }).toBeTruthy();

    // Step 6: Wait for the info panel to load the forecast
    // The info panel should now show the weather forecast section.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Step 6 (Expected Results): Verify the number of forecast entries
    // The forecast should have 24 entries.
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);

    // Additional Assertions from Expected Results:
    // - Precipitation overlay layer toggle is in the enabled state (checked)
    await expect(precipitationToggle).toBeChecked();
    // - Temperature overlay layer toggle is in the disabled state (unchecked)
    await expect(temperatureToggle).not.toBeChecked();

    // Verify layer rendering state via map model helpers
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
});
