// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure info panel is visible (it is visible by default per UI Map)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on the map canvas to trigger GetFeatureInfo / weather forecast
    // Using a central position on the map container
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 300, y: 300 } });

    // Wait for the info panel to load the forecast
    // The forecast section should become visible
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible({ timeout: 10000 });

    // Verify the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Verify the info panel displays a weather forecast section
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Verify the forecast contains 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
