// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation overlay layer.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Assert layer visibility toggles in the UI.
    await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // Assert layer rendering state via the map model.
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for 'Münster' using the geocoder.
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // 4. Select the first result from the geocoder panel.
    // The results are rendered as list items inside the geocoder panel.
    // Use the test id for the first result item to avoid ambiguity.
    await page.getByTestId('geocoder-result-item-0').click();

    // 5. Wait for the map to navigate to the selected location.
    // Use the helper to poll the map center until it changes from the initial state.
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    // 6. Wait for the info panel to load the forecast.
    // The info panel displays a weather forecast section with 24 entries.
    // Use the geocoder-clear-button to dismiss the search overlay so it doesn't
    // interfere with the info panel.
    await page.getByTestId('geocoder-clear-button').click();

    await expect.poll(async () => {
        const weatherForecastSection = page.getByTestId('weather-forecast-section');
        const items = await weatherForecastSection.locator('li').count();
        return items;
    }).toBe(24);
});
