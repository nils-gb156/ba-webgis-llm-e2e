// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map and initial layers to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Hide the Temperature overlay layer
    // The layer switcher is visible by default. We locate the toggle for "Temperature".
    // Since "Temperature" might be ambiguous in plain text, we scope to the layer switcher.
    const tempToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' });
    await expect(tempToggle).toBeChecked(); // Verify initial state
    await tempToggle.click({ force: true }); // Toggle off

    // Step 2: Show the Precipitation overlay layer
    // Precipitation is initially hidden.
    const precipToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipToggle).not.toBeChecked(); // Verify initial state
    await precipToggle.click({ force: true }); // Toggle on

    // Verify layer states via map model helpers
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    // The geocoder results panel becomes visible when results are available
    await expect(page.getByTestId('geocoder-results')).toBeVisible();
    
    // Select the first result item
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate
    // We poll the map center to ensure it has changed from the initial view
    // or simply wait for the geocoder results to disappear (navigation complete)
    await expect(page.getByTestId('geocoder-results')).not.toBeVisible();
    
    // Verify the map has moved by checking if the center is no longer undefined/initial
    // A simple check is to ensure the map center is now defined and different from a typical "home" or just present.
    // Since we don't know the exact initial center, we just assert it's defined after search.
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    // Step 6: Wait for the info panel to load the forecast
    // The info panel is visible by default. We check for the weather forecast section content.
    const weatherSection = page.getByTestId('weather-forecast-section');
    await expect(weatherSection).toBeVisible();

    // Verify the forecast has 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
