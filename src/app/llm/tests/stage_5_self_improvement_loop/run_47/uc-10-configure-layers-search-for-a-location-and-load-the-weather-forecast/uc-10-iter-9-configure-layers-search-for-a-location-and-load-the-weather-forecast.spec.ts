// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide the Temperature overlay layer
    const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
    await expect(temperatureToggle).toBeChecked();
    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show the Precipitation overlay layer
    const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
    await expect(precipitationToggle).not.toBeChecked();
    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location using the geocoder
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel).toBeVisible();
    
    // The first result is "Münster, North Rhine-Westphalia, Germany"
    // We use the test id for the first result item for a stable and unambiguous locator.
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate to the selected location
    // The map center changes to the coordinates of the selected place.
    await expect.poll(() => page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: { olMap?: { getView?: () => { getZoom?: () => number } } } }).__openPioneerMap;
        return map?.olMap?.getView()?.getZoom?.() !== undefined;
    })).toBeTruthy();

    // Step 6: Wait for the info panel to load the forecast
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Wait for the weather forecast section to have at least 24 entries.
    // The entries are rendered as paragraphs within the section.
    await expect.poll(async () => {
        // Count paragraphs within the weather forecast section
        const count = await weatherForecastSection.locator('p').count();
        return count;
    }).toBeGreaterThanOrEqual(24);
});
