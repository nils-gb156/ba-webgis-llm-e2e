// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Click the visibility toggle of the Temperature overlay layer to hide it.
    // The layer switcher is visible by default. We look for the Temperature layer item.
    // Assuming the layer items have a test id or can be found by text.
    // Based on the UI map, we have `layer-switcher` panel.
    // We need to find the specific layer toggle. Let's assume standard naming or use getByText within the layer switcher.
    // Since specific test ids for layer items aren't listed in the prompt's table, we use getByText scoped to the layer switcher.
    const temperatureLayerItem = page.getByTestId('layer-switcher').getByText('Temperature');
    // Click the checkbox/switch associated with Temperature.
    // Chakra UI checkboxes are tricky. We click the role locator with force.
    await temperatureLayerItem.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // Step 2: Click the visibility toggle of the Precipitation overlay layer to show it.
    const precipitationLayerItem = page.getByTestId('layer-switcher').getByText('Precipitation');
    await precipitationLayerItem.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify layer states
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Click the search field and type a place name (e.g. 'Münster').
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result.
    // The geocoder results panel becomes visible.
    await expect(page.getByTestId('geocoder-results')).toBeVisible();
    
    // Select the first result. Assuming test ids like `geocoder-result-item-0`
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate to the selected location.
    // We poll the map center to ensure it has moved from the initial position.
    // Initial center is likely around Germany/Europe. Münster is approx (690000, 5900000) in EPSG:3857.
    // We just wait for the center to change or settle.
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        return currentCenter && (initialCenter === undefined || currentCenter[0] !== initialCenter[0] || currentCenter[1] !== initialCenter[1]);
    }).toBeTruthy();

    // Step 6: Wait for the info panel to load the forecast.
    // The info panel is visible by default. It should contain the weather forecast section.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Expected result: The info panel displays a weather forecast section with 24 entries.
    // We count the number of weather forecast entries.
    const weatherEntries = page.getByTestId('weather-forecast-entry');
    await expect(weatherEntries).toHaveCount(24);
});
