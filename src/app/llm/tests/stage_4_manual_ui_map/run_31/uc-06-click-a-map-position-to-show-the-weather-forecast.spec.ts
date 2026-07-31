// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default, but let's be explicit)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger the weather forecast
    // The map container is the element with test-id "map-container"
    // We click near the center of the map
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });

    // Wait for the info panel to load the forecast
    // The forecast appears after clicking and loading
    await expect(page.getByTestId('weather-forecast')).toBeVisible();

    // Verify the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Verify the forecast contains 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
