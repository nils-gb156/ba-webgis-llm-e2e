// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Hide the Temperature overlay layer.
    // The checkbox is visually hidden behind a Chakra UI control, so we use force: true.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // 2. Show the Precipitation overlay layer.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify layer state changes.
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // 3. Search for 'Münster' using the geocoder.
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    // 4. Wait for the result list to appear and select the first result.
    // The geocoder panel contains a list of results; the first item is the primary match.
    const geocoderPanel = page.getByTestId('geocoder-panel');
    // The first result item has the data-testid 'geocoder-result-item-0'
    const firstResult = geocoderPanel.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // 5. Wait for the map to navigate to the selected location.
    // Münster is approximately at 7.62°E, 51.96°N. In EPSG:3857 this is roughly [848000, 6740000].
    // The actual center is approximately [848832, 6793349].
    await expect.poll(() => getMapCenter(page)).toMatchObject([
        expect.closeTo(848832, 50000),
        expect.closeTo(6793349, 50000),
    ]);

    // 6. Wait for the info panel to load the forecast.
    // The info panel should display a weather forecast section with 24 entries.
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();

    // Count the forecast entries. They are typically rendered as a list or grid items.
    // We expect at least 24 entries (24 hours).
    const forecastEntries = infoPanel.getByTestId('weather-forecast-entry');
    await expect.poll(() => forecastEntries.count()).toBeGreaterThanOrEqual(24);
});
