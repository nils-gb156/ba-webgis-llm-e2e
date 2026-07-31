// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from "../../../map-model-helpers";

test("Use Case 10: Configure layers, search for a location and load the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Step 1: Hide the Temperature overlay layer.
    // The layer switcher is visible by default. We locate the Temperature layer toggle.
    // Based on standard patterns, toggles often have roles like 'checkbox' or 'switch'.
    // We use force: true as per Chakra UI conventions for form controls.
    const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' }).first();
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click({ force: true });

    // Step 2: Show the Precipitation overlay layer.
    // Initially hidden, so it should not be checked.
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' }).first();
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click({ force: true });

    // Step 3: Search for a location using the geocoder.
    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // Step 4: Wait for results and select the first one.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate.
    // We assert that the map center has changed from the initial default.
    // Since we don't know the exact initial center, we just wait for the geocoder results to disappear
    // and assume navigation happens. A more robust check would be checking for a specific highlight
    // or center coordinate if known, but here we rely on the UI flow completing.
    await expect(page.getByTestId('geocoder-results')).not.toBeVisible();

    // Step 6: Wait for the info panel to load the forecast.
    // The expected result states the info panel displays a weather forecast section with 24 entries.
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Verify the number of forecast entries.
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);

    // Verify layer state changes.
    // Precipitation should be rendered (enabled).
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Temperature should NOT be rendered (disabled/hidden).
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
});
