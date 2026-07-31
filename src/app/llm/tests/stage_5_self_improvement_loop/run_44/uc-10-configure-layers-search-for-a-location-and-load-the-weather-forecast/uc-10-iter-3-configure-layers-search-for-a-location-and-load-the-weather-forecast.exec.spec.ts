// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to settle
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Hide the Temperature overlay layer
    const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
    await temperatureToggle.click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show the Precipitation overlay layer
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await precipitationToggle.click({ force: true });
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Click the search field and type a place name
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel.getByTestId('geocoder-result-item-0')).toBeVisible();
    await geocoderPanel.getByTestId('geocoder-result-item-0').click();

    // Step 5: Wait for the map to navigate to the selected location
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !initialCenter) return false;
        // Check if center has moved significantly
        return Math.abs(center[0] - initialCenter[0]) > 1000 || Math.abs(center[1] - initialCenter[1]) > 1000;
    }).toBe(true);

    // Step 6: Wait for the info panel to load the forecast
    const forecastSection = page.getByTestId('weather-forecast-section');
    await expect(forecastSection).toBeVisible();
    // The expected result mentions 24 entries.
    // The entries are rendered with data-testid="weather-forecast-entry"
    await expect.poll(() => page.getByTestId('weather-forecast-entry').count()).toBe(24);
});
