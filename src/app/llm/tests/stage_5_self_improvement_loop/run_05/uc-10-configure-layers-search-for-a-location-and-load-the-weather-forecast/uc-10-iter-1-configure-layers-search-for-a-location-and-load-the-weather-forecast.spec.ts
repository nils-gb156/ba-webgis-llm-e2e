// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide the Temperature overlay layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // Step 2: Show the Precipitation overlay layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify layer visibility via map model helpers
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a place using the geocoder
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Select the first result
    // The geocoder panel is a dialog/listbox; wait for it to be visible
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel).toBeVisible();

    // Select the first result item using its specific test id
    await page.getByTestId('geocoder-result-item-0').click();

    // Step 5: Wait for the map to navigate to the selected location
    // We verify navigation by checking that the center has changed from the initial extent.
    // Initial center is roughly [2095000, 6130000] (Berlin area). Münster is roughly [2490000, 6120000].
    // We poll the center until it is reasonably close to Münster's coordinates.
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) return false;
        // Check if the center is roughly in the Münster area (x > 2400000)
        return center[0] > 2400000 && center[1] > 6100000 && center[1] < 6200000;
    }).toBe(true);

    // Step 6: Wait for the info panel to load the forecast
    // The forecast section should appear with 24 entries
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Verify that the forecast section contains 24 entries
    // Assuming each forecast entry is a list item or similar structure within the section
    const forecastEntries = weatherForecastSection.locator('li').or(weatherForecastSection.locator('[role="listitem"]'));
    await expect(forecastEntries).toHaveCount(24);
});
