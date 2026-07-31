// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default, but we assert it)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the center of the map canvas
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 250, y: 250 } });

    // Wait for the forecast to load and appear in the info panel
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();

    // Assert that the forecast contains 24 entries
    const entries = page.getByTestId('weather-forecast-entry');
    await expect(entries).toHaveCount(24);

    // Assert that the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
