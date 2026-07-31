// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default, but we assert it)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map center to trigger a forecast request
    // The map container is the canvas area. We click near the center.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Wait for the weather forecast section to appear in the info panel
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Wait for the actual forecast content to load
    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();

    // Assert that the forecast contains 24 entries
    // We poll because the entries load asynchronously after the map click
    await expect.poll(() => weatherForecast.getByTestId('weather-forecast-entry').count()).toBe(24);

    // Assert that the clicked position is highlighted on the map
    // We poll because the highlight is added asynchronously after the GetFeatureInfo response
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
});
