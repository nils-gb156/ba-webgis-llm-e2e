// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default per UI Map)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger the forecast
    // Using the center of the map container as a safe click position
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    // Wait for the weather forecast section to appear in the info panel
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Wait for the map highlight to appear
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Wait for the forecast entries to load
    // The expected result states 24 entries. We assert on the count of weather-forecast-entry elements.
    const forecastEntries = page.getByTestId(/weather-forecast-entry-\d+/);
    await expect.poll(() => forecastEntries.count()).toBe(24);
});
