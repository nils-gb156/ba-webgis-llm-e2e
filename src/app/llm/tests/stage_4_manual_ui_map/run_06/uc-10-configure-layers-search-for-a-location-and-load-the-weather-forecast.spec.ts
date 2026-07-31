// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter, getHighlightedCoordinate } from "../../../map-model-helpers";

test("Use Case 10: Configure layers, search for a location and load the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Step 1: Hide the Temperature overlay layer.
    // The layer switcher is visible by default. We click the checkbox for "Temperature".
    // Using force: true because Chakra UI checkboxes render the input visually hidden.
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // Step 2: Show the Precipitation overlay layer.
    await page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Step 3: Search for a location using the geocoder.
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one.
    // We wait for the first result item to be visible, then click it.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate to the selected location.
    // We check that the map center has changed from the initial default.
    // We also check for a highlight marker which usually appears on geocoder selection.
    await expect.poll(() => getMapCenter(page)).not.toBe(undefined);
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBe(undefined);

    // Step 6: Wait for the info panel to load the forecast.
    // The weather forecast section appears after clicking the map or selecting a location.
    // We expect the forecast container to be visible and contain entries.
    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();
    
    // Check for 24 entries in the weather forecast.
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);

    // Verify layer states via map model helpers.
    // Temperature should NOT be rendered.
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    // Precipitation SHOULD be rendered.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
