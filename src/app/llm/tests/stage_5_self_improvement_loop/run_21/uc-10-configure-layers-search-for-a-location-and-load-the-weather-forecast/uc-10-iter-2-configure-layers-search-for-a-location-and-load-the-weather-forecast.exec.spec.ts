// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer.
    // The accessibility tree shows the checkbox is currently checked.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // 2. Show the Precipitation overlay layer.
    // The accessibility tree shows the checkbox is currently unchecked.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for a place using the geocoder.
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // 4. Wait for the result list to appear and select the first result.
    // The results are rendered as list items with data-testid attributes.
    // The first result corresponds to 'geocoder-result-item-0'.
    const geocoderResults = page.getByTestId('geocoder-results');
    await expect(geocoderResults).toBeVisible();
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for the map to navigate to the selected location (highlight marker appears).
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // 6. Wait for the info panel to load the forecast.
    const forecastSection = page.getByTestId('weather-forecast-section');
    await expect(forecastSection).toBeVisible();
    // The forecast entries are rendered as individual items with a data-testid,
    // not inside a <ul>/<li> structure.
    const forecastItems = forecastSection.getByTestId('weather-forecast-entry');
    await expect.poll(() => forecastItems.count()).toBe(24);
});
