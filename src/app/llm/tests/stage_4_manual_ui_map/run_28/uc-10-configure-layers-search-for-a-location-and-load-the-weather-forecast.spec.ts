// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to render
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Hide Temperature layer
    // The UI map indicates 'Temperature' is in the operational checkbox-list.
    // We use force: true because Chakra UI checkboxes hide the real input.
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureCheckbox).toBeChecked();
    await temperatureCheckbox.click({ force: true });

    // Step 2: Show Precipitation layer
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationCheckbox).not.toBeChecked();
    await precipitationCheckbox.click({ force: true });

    // Verify layer state changes via map model helpers
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for 'Münster'
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one
    // The results list appears dynamically. We wait for the first result item.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for map to navigate
    // We poll the map center to ensure it has moved from the initial position.
    // We don't know the exact coordinates, but we know it should change.
    const initialCenter = await getMapCenter(page);
    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        return currentCenter !== undefined && (
            currentCenter[0] !== initialCenter?.[0] ||
            currentCenter[1] !== initialCenter?.[1]
        );
    }).toBe(true);

    // Step 6: Wait for weather forecast to load in the info panel
    // The forecast section appears after clicking the map or navigating, and loads asynchronously.
    // We wait for at least one forecast entry to be visible.
    const firstForecastEntry = page.getByTestId('weather-forecast-entry').first();
    await expect(firstForecastEntry).toBeVisible();

    // Verify the number of forecast entries (expected 24)
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
