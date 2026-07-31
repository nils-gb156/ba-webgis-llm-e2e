// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default, but let's be explicit)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger the forecast
    // We click near the center of the map container
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found');
    }
    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;

    await page.mouse.click(clickX, clickY);

    // Wait for the weather forecast section to appear in the info panel
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Wait for the forecast entries to load
    // The expected result is 24 entries
    const weatherForecastEntry = page.getByTestId('weather-forecast-entry');
    const entryCount = await weatherForecastEntry.count();
    await expect.poll(() => weatherForecastEntry.count()).toBe(24);

    // Verify the clicked position is highlighted on the map
    // We use the helper to check if a highlight exists.
    // Note: The prompt says "The clicked position is highlighted on the map".
    // We can assert that a highlight is present.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Verify that the UV-Index layer is rendered (as it's part of the weather data usually)
    // Or just check that the info panel has the content.
    // The prompt doesn't specify checking layer visibility, but let's check the info panel content.
    const weatherForecast = page.getByTestId('weather-forecast');
    await expect(weatherForecast).toBeVisible();
});
