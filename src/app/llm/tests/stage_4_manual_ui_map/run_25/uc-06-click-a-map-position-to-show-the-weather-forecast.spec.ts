// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default, but we assert it anyway)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas. Using the center of the map container.
    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container not found');
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Wait for the highlight to appear on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Wait for the weather forecast section to become visible
    await expect(page.getByTestId('weather-forecast')).toBeVisible();

    // Wait for the forecast entries to load (polling until we have at least one entry)
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect.poll(async () => forecastEntries.count()).toBeGreaterThanOrEqual(1);

    // Assert that the forecast contains 24 entries
    await expect(forecastEntries).toHaveCount(24);
});
