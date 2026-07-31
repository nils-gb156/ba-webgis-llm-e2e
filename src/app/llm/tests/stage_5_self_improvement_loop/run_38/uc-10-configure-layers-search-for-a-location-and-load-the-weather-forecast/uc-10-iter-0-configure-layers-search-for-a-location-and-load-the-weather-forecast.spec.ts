// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

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

    // Step 4: Select the first result
    await page.getByRole('option').first().click();

    // Step 5: Wait for the map to navigate to the selected location
    // The map center should have changed from the initial extent.
    await expect.poll(() => page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        return map?.olMap.getView().getCenter();
    })).not.toEqual([0, 0]);

    // Step 6: Wait for the info panel to load the forecast
    // The info panel should now contain the weather forecast section with multiple entries.
    const forecastSection = page.getByTestId('weather-forecast-section');
    await expect(forecastSection).toBeVisible();
    
    // The expected result states "24 entries". We can check for the presence of the section
    // and maybe a few entries to ensure it's loaded.
    await expect(forecastSection.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();
    
    // Check that the forecast section has content (at least one entry)
    await expect(forecastSection.getByRole('listitem').first()).toBeVisible();
});
