// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready before interacting
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    // 1. Hide Temperature layer
    // The default is Temperature visible. We click its toggle to hide it.
    // We use force: true because Chakra UI checkboxes have a hidden input.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    
    // Verify Temperature is hidden via map model
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // 2. Show Precipitation layer
    // The default is Precipitation hidden. We click its toggle to show it.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
    
    // Verify Precipitation is visible via map model
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // 4. Wait for results and select the first one
    // The results list appears after typing. We wait for the first result item.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for map to navigate to the selected location
    // The map center changes after selecting a geocoder result.
    // We poll for the center to change from the initial value to ensure navigation happened.
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center && (center[0] !== initialCenter?.[0] || center[1] !== initialCenter?.[1]);
    }).toBe(true);

    // 6. Wait for the info panel to load the forecast
    // The weather forecast section appears after clicking the map (which happens during geocoder navigation)
    // and the forecast loads.
    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();

    // Verify the forecast has 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
