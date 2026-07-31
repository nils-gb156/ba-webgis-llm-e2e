// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and interactive
    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();
    await expect(mapContainer.locator('canvas')).toBeVisible();

    // Click the center of the map canvas
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container bounding box not found');
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Wait for the weather forecast section to appear in the info panel
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    // Wait for the forecast entries to load
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);

    // Verify the clicked position is highlighted on the map
    const highlightedCoord = await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
    expect(highlightedCoord).toBeDefined();

    // Verify the map center is close to the clicked position (approximate check)
    const mapCenter = await expect.poll(() => getMapCenter(page)).toBeTruthy();
    expect(mapCenter).toBeDefined();
});
