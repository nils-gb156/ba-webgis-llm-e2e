// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default, but let's be explicit if needed)
    // The UI map says info-panel is visibleByDefault: true, toggledBy info-panel-toggle.
    // Since it's visible by default, we don't need to toggle it.

    // Click on the map to trigger the forecast
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 100, y: 100 }
    });

    // Wait for the forecast to load
    // The forecast appears after the user clicks on the map and the forecast loads
    await expect(page.getByTestId('weather-forecast')).toBeVisible();

    // Assert that the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Assert that the info panel displays a weather forecast section
    // This is already covered by the visibility check above, but let's be thorough
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Assert that the forecast contains 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
