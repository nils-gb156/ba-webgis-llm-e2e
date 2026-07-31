// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide the Temperature overlay layer
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show the Precipitation overlay layer
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location using the geocoder
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result
    // The results are rendered as list items within the geocoder panel.
    await page.getByTestId('geocoder-result-item-0').click();

    // Step 5: Wait for the map to navigate to the selected location.
    // We use the helper to check if the center has moved from the initial extent.
    // Münster, Germany is roughly at [7.6, 51.9] lon/lat, which maps to approx [674000, 6580000] in EPSG:3857.
    // We just need to verify the center changed significantly.
    await expect.poll(() => {
        const center = getMapCenter(page);
        return center !== undefined && (Math.abs(center[0]) > 1000000 || Math.abs(center[1]) > 1000000);
    }).toBe(true);

    // Step 6: Wait for the info panel to load the forecast.
    // The expected result states "24 entries".
    const forecastSection = page.getByTestId('weather-forecast-section');
    
    // Wait for the section to be visible
    await expect(forecastSection).toBeVisible();
    
    // Wait for the heading to be visible
    await expect(forecastSection.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();
    
    // Wait for the list items to appear. We expect 24 entries.
    // We'll wait for at least one to be visible first, then assert the count.
    await expect(forecastSection.getByRole('listitem').first()).toBeVisible();
    
    // Assert that there are exactly 24 list items as per the expected result
    await expect.poll(() => forecastSection.getByRole('listitem').count()).toBe(24);
});
