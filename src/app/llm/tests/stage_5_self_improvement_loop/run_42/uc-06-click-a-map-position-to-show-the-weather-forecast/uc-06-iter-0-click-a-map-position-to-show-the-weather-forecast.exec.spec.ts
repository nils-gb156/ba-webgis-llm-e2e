// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible (it is visible by default per the initial state)
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on a position on the map canvas
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 400, y: 300 },
    });

    // Wait for the info panel to load the forecast
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Verify the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Verify the info panel displays a weather forecast section
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // Verify the forecast contains 24 entries
    const forecastSection = page.getByTestId('weather-forecast-section');
    const forecastEntries = forecastSection.locator('li');
    await expect(forecastEntries).toHaveCount(24);
});
