// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();

    // 1. Hide Temperature overlay
    // The layer switcher is visible by default. We click the toggle for "Temperature".
    // Based on the UI map, we need to find the specific toggle.
    // Since specific layer toggle test-ids are not listed, we use getByRole with exact name.
    // Assuming the layer switcher panel contains the layer items.
    const layerSwitcher = page.getByTestId('layer-switcher');
    const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    // Ensure it is currently checked (visible) before clicking to hide
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click({ force: true });

    // 2. Show Precipitation overlay
    // Precipitation is initially hidden.
    const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click({ force: true });

    // Assert layer visibility via map model helpers
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a location 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // 4. Wait for results and select the first one
    // The results panel appears below the input
    const geocoderResults = page.getByTestId('geocoder-results');
    await expect(geocoderResults).toBeVisible();
    
    // Select the first result item
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for map to navigate
    // The map should zoom to the location. We can assert by checking if the center changes
    // or simply wait for the info panel to update, which implies navigation.
    // Let's wait for the info panel to contain the weather forecast section.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // 6. Assert the info panel displays 24 forecast entries
    // The weather forecast entries are rendered as individual elements
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
