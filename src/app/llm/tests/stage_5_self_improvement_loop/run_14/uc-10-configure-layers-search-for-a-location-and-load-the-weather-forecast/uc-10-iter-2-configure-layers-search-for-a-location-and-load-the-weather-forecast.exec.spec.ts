// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation overlay layer
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Assert layer state via map model helpers
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a location using the geocoder
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // 4. Wait for the result list to appear and select the first result
    // The geocoder panel appears with results. We wait for the first result item to be visible.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for the map to navigate to the selected location
    // The map view settles after selecting a result. We poll the map center to wait for navigation.
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    // 6. Wait for the info panel to load the forecast
    // The forecast section with 24 entries should appear.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Assert that the info panel displays a weather forecast section with 24 entries
    // Based on the accessibility tree, each forecast entry is a paragraph with a specific timestamp.
    // We count the paragraphs that match the timestamp pattern to verify there are 24 entries.
    const forecastEntries = weatherForecastSection.locator('p').filter({ hasText: /^Fri, Jul/ });
    await expect(forecastEntries).toHaveCount(24);
});
