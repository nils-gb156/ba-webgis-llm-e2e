// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Click on a position on the map canvas
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Wait for the info panel to load the forecast
    await expect.poll(() => page.getByTestId('weather-forecast-section').isVisible()).toBeTruthy();

    // The clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // The info panel displays a weather forecast section
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

    // The forecast contains 24 entries
    const forecastItems = page.getByTestId('weather-forecast-section').locator('li');
    await expect(forecastItems).toHaveCount(24);
});
